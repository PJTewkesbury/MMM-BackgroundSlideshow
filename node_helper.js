/* global Module */

/* MMM-PlexSlideshow.js
 *
 * Magic Mirror
 * Module: MMM-PlexSlideshow - Modifications by Peter Tewkesbury, Original code by Adam Moses and Darick Carpenter.
 *
 * Magic Mirror By Michael Teeuw http://michaelteeuw.nl
 * MIT Licensed.
 *
 * Based Module MMM-BackgroundSlideShow by Darick Carpenter
 * and that is based on MMM-ImageSlideShow by Adam Moses
 * MIT Licensed.
 */

// call in the required classes
var NodeHelper = require('node_helper');
var FileSystemImageSlideshow = require('fs');
var PlexAPI = require("plex-api");
var api = null;

// the main module helper create
module.exports = NodeHelper.create({
  // subclass start method, clears the initial config array
  start: function () {
    //this.moduleConfigs = [];
  },
  // shuffles an array at random and returns it
  shuffleArray: function (array) {
    var currentIndex = array.length,
      temporaryValue,
      randomIndex;
    while (0 !== currentIndex) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }
    return array;
  },
  // sort by filename attribute
  sortByFilename: function (a, b) {
    aL = a.toLowerCase();
    bL = b.toLowerCase();
    if (aL > bL) return 1;
    else return -1;
  },
  // checks there's a valid image file extension
  checkValidImageFileExtension: function (filename, extensions) {
    var extList = extensions.split(',');
    for (var extIndex = 0; extIndex < extList.length; extIndex++) {
      if (filename.toLowerCase().endsWith(extList[extIndex])) return true;
    }
    return false;
  },

  gatherPlexImageList: function (config) {

    if (api === null) {
      var options = {
        hostname: config.plex.hostname !== null ? config.plex.hostname : "localhost",
        port: config.plex.port ? config.plex.port : 32400,
        username: config.plex.username,
        // password: config.plex.password,
        token: config.plex.authToken,
        options: {
          identifier: '9d478fe9-924e-4e06-aaa0-ed7dbb850c1b',
          product: 'MMM-PlexSlideShow',
          version: '1.1',
          device: 'Raspberry PI',
          deviceName: 'ClockPI',
          platform: 'NodeJS',
          platformVersion: '1.0',
        }
      };

      console.log("Create PLEX Client : ", options);
      api = new PlexAPI(options);
      api.authToken = config.plex.authToken;
      console.log("PLEX Client created");
    }

    var self = this;
    var imageList = [];
    return new Promise((resolve, reject) => {
      // Get list of playlists
      // api.query('/playlists?playlistType=photo&includeCollections=1&includeExternalMedia=1&includeAdvanced=1&includeMeta=1&X-Plex-Container-Start=0&X-Plex-Container-Size=50').then(function (results2) {
      api.query('/playlists?playlistType=photo&X-Plex-Container-Start=0&X-Plex-Container-Size=500').then(function (results2) {
        // Find playlist of photos which is Favorites
        var r2 = results2.MediaContainer.Metadata.find(x => { return (x.specialPlaylistType == "favorites" && x.playlistType == "photo"); });

        // Get all items in playlist
        api.query(r2.key).then(function (results3) {
          (results3.MediaContainer.Metadata).forEach(e => {
            // Get Url to each item and save
             var scheme = "http://";
            if (config.plex.port == 443 || config.plex.https === true)
              scheme = "https://";
            var url = scheme + config.plex.hostname + ":" + config.plex.port + e.Media[0].Part[0].key + "?X-Plex-Token=" + api.authToken;
            console.log(url);
            imageList.push(url);
          });
          return resolve(imageList);
        });
      });
    });
  },


  // gathers the image list
  gatherImageList: function (config) {
    var self = this;
    // create an empty main image list
    var imageList = [];
    for (var i = 0; i < config.imagePaths.length; i++) {
      this.getFiles(config.imagePaths[i], imageList, config);
    }

    imageList = config.randomizeImageOrder
      ? this.shuffleArray(imageList)
      : imageList.sort(this.sortByFilename);

    return imageList;
  },

  getFiles(path, imageList, config) {
    var contents = FileSystemImageSlideshow.readdirSync(path);
    for (let i = 0; i < contents.length; i++) {
      var currentItem = path + '/' + contents[i];
      var stats = FileSystemImageSlideshow.lstatSync(currentItem);
      if (stats.isDirectory() && config.recursiveSubDirectories) {
        this.getFiles(currentItem, imageList, config);
      } else if (stats.isFile()) {
        var isValidImageFileExtension = this.checkValidImageFileExtension(
          currentItem,
          config.validImageFileExtensions
        );
        if (isValidImageFileExtension) imageList.push(currentItem);
      }
    }
  },
  // subclass socketNotificationReceived, received notification from module
  socketNotificationReceived: function (notification, payload) {
    if (notification === 'BACKGROUNDSLIDESHOW_REGISTER_CONFIG') {
      // this to self
      var self = this;

      // get the image list
      // var imageList = this.gatherImageList(payload);
      var imageList = [];
      this.gatherPlexImageList(payload).then((r) => {
        imageList = r;
        if (config.randomizeImageOrder) {
          imageList = this.shuffleArray(imageList);
        }

        // build the return payload
        var returnPayload = {
          identifier: payload.identifier,
          imageList: imageList
        };
        // send the image list back
        self.sendSocketNotification(
          'BACKGROUNDSLIDESHOW_FILELIST',
          returnPayload
        );
      });
    }
  }
});

//------------ end -------------
