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

function httpGetAsync(theUrl, callback) {
	var xmlHttp = new XMLHttpRequest();
	xmlHttp.responseType = "blob";
	xmlHttp.onreadystatechange = function () {
		if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
			var blob = xmlHttp.response; // Note: not oReq.responseText
			if (blob) {
				getOrientation(blob, x => {
					callback(x);
				});
			}
		}
	};
	xmlHttp.open("GET", theUrl, true);
	xmlHttp.send(null);
}

function getOrientation(file, callback) {	
	var reader = new FileReader();
	reader.onload = function (e) {
		var view = new DataView(e.target.result);

		if (view.getUint16(0, false) != 0xFFD8) { return callback(-2); }

		var length = view.byteLength,
			offset = 2;

		while (offset < length) {
			var marker = view.getUint16(offset, false);
			offset += 2;

			if (marker == 0xFFE1) {
				if (view.getUint32(offset += 2, false) != 0x45786966) {
					return callback(-1);
				}
				var little = view.getUint16(offset += 6, false) == 0x4949;
				offset += view.getUint32(offset + 4, little);
				var tags = view.getUint16(offset, little);
				offset += 2;

				for (var i = 0; i < tags; i++) {
					if (view.getUint16(offset + (i * 12), little) == 0x0112) {
						return callback(view.getUint16(offset + (i * 12) + 8, little));
					}
				}
			}
			else if ((marker & 0xFF00) != 0xFF00) {
				break;
			}
			else {
				offset += view.getUint16(offset, false);
			}
		}
		return callback(-1);
	};
	reader.readAsArrayBuffer(file);
}

Module.register("MMM-PlexSlideshow", {
	// Default module config.
	defaults: {
		plex: {
			hostname: "localhost",
			port: 32400,
			username: "",
			password: "",
		},
		// the speed at which to switch between images, in milliseconds
		slideshowSpeed: 10 * 1000,
		// if true randomize image order, otherwise do alphabetical
		randomizeImageOrder: false,
		// transition speed from one image to the other, transitionImages must be true
		transitionSpeed: "1s",
		// the sizing of the background image
		// cover: Resize the background image to cover the entire container, even if it has to stretch the image or cut a little bit off one of the edges
		// contain: Resize the background image to make sure the image is fully visible
		backgroundSize: "cover", // cover or contain
		// transition from one image to the other (may be a bit choppy on slower devices, or if the images are too big)
		transitionImages: false,
		// the gradient to make the text more visible
		gradient: [
			"rgba(0, 0, 0, 0.75) 0%",
			"rgba(0, 0, 0, 0) 40%",
			"rgba(0, 0, 0, 0) 80%",
			"rgba(0, 0, 0, 0.75) 100%"
		],
		horizontalGradient: [
			"rgba(0, 0, 0, 0.75) 0%",
			"rgba(0, 0, 0, 0) 40%",
			"rgba(0, 0, 0, 0) 80%",
			"rgba(0, 0, 0, 0.75) 100%"
		],
		// the direction the gradient goes, vertical or horizontal
		gradientDirection: "vertical"
	},
	// load function
	start: function () {
		// add identifier to the config
		this.config.identifier = this.identifier;
		// set no error
		this.errorMessage = null;
		if (this.config.plex.hostname.length == 0 || this.config.plex.username.length == 0 || this.config.plex.password.length == 0) {
			this.errorMessage =
				"MMM-PlexSlideshow: Missing required parameter.";
		} else {
			// create an empty image list
			this.imageList = [];
			// set beginning image index to 0, as it will auto increment on start
			this.imageIndex = 0;
			this.updateImageList();
		}
	},
	// Define required scripts.
	getStyles: function () {
		// the css contains the make grayscale code
		return ["PlexSlideshow.css"];
	},
	// generic notification handler
	notificationReceived: function (notification, payload, sender) {
		if (sender) {
			// Log.log(this.name + " received a module notification: " + notification + " from sender: " + sender.name);
			if (notification === "BACKGROUNDSLIDESHOW_IMAGE_UPDATE") {
				Log.log("MMM-PlexSlideshow: Changing Background");
				this.suspend();
				this.updateImage();
				this.resume();
			}
			else if (notification === "BACKGROUNDSLIDESHOW_NEXT") { // Change to next image
				this.updateImage();
				if (this.timer) { // Restart timer only if timer was already running
					this.resume();
				}

			}
			else if (notification === "BACKGROUNDSLIDESHOW_PLAY") { // Change to next image and start timer.
				this.updateImage();
				this.resume();
			}
			else if (notification === "BACKGROUNDSLIDESHOW_PAUSE") { // Stop timer.
				this.suspend();
			}
			else {
				// Log.log(this.name + " received a system notification: " + notification);
			}
		}
	},
	// the socket handler
	socketNotificationReceived: function (notification, payload) {
		// if an update was received
		if (notification === "BACKGROUNDSLIDESHOW_FILELIST") {
			// check this is for this module based on the woeid
			if (payload.identifier === this.identifier) {
				// console.info('Returning Images, payload:' + JSON.stringify(payload));
				// set the image list
				this.imageList = payload.imageList;
				// if image list actually contains images
				// set loaded flag to true and update dom
				if (this.imageList.length > 0) {
					this.updateImage(); //Added to show the image at least once, but not change it within this.resume()
					this.resume();
				}
			}
		}
	},
	// Override dom generator.
	getDom: function () {
		var wrapper = document.createElement("div");
		this.div1 = this.createDiv("big1");
		this.div2 = this.createDiv("big2");

		wrapper.appendChild(this.div1);
		wrapper.appendChild(this.div2);

		if (
			this.config.gradientDirection === "vertical" ||
			this.config.gradientDirection === "both"
		) {
			this.createGradientDiv("bottom", this.config.gradient, wrapper);
		}

		if (
			this.config.gradientDirection === "horizontal" ||
			this.config.gradientDirection === "both"
		) {
			this.createGradientDiv("right", this.config.gradient, wrapper);
		}

		return wrapper;
	},

	createGradientDiv: function (direction, gradient, wrapper) {
		var div = document.createElement("div");
		div.style.backgroundImage =
			"linear-gradient( to " + direction + ", " + gradient.join() + ")";
		div.className = "gradient";
		wrapper.appendChild(div);
	},

	createDiv: function (name) {
		var div = document.createElement("div");
		div.id = name + this.identifier;
		div.style.backgroundSize = this.config.backgroundSize;
		div.style.transition =
			"opacity " + this.config.transitionSpeed + " ease-in-out";
		div.className = "backgroundSlideShow";
		return div;
	},

	updateImage: function () {
		if (this.imageList && this.imageList.length) {
			if (this.imageIndex < this.imageList.length) {
				if (this.config.transitionImages) {
					this.swapDivs();
				}
				var div1 = this.div1;
				var div2 = this.div2;

				// div2.style.backgroundImage = div1.style.backgroundImage;
				var image = new Image();
				image.onload = function () {
					var o = "";
					// Read file bytes
					httpGetAsync(this.src, res => {
						o = res;
						console.log("Image : "+this.src);
						console.log("Orientation : "+res);
						if (o==8)
						{
							console.log("Rotating image");
							div1.style.transform="rotate(90deg)";
						}
						else
						{
							div1.style.transform="";
						}
					});

					div1.style.backgroundImage = "url('" + this.src + "')";
					div1.style.opacity = "1";
					div2.style.opacity = "0";
				};
				image.src = encodeURI(this.imageList[this.imageIndex]);
				this.sendNotification("BACKGROUNDSLIDESHOW_IMAGE_UPDATED", { url: image.src });
				this.imageIndex += 1;
			} else {
				this.imageIndex = 0;
				this.updateImageList();
			}
		}
	},

	swapDivs: function () {
		var temp = this.div1;
		this.div1 = this.div2;
		this.div2 = temp;
	},

	suspend: function () {
		if (this.timer) {
			clearInterval(this.timer);
			this.timer = null;
		}
	},
	resume: function () {
		//this.updateImage(); //Removed to prevent image change whenever MMM-Carousel changes slides
		this.suspend();
		var self = this;
		this.timer = setInterval(function () {
			self.updateImage();
		}, self.config.slideshowSpeed);
	},
	updateImageList: function () {
		this.suspend();
		// console.info('Getting Images');
		// ask helper function to get the image list
		this.sendSocketNotification(
			"BACKGROUNDSLIDESHOW_REGISTER_CONFIG",
			this.config
		);
	}
});

