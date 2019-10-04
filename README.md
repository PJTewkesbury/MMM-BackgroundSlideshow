# Module: Plex Favorites Slideshow

Show a slideshow of images in the background. Great for a photo frame from instead of a mirror, using photos marked as 'favorite' from your PLEX Server.

The `MMM-PlexSlideshow` module is designed to display images fullscreen, one at a time on a fixed interval, from your PLEX server. These images can be shown in order or at random. The images can transition from one to the other and be shown with no edge (cover) or the enter image(contain).

Based on <a href="https://github.com/AdamMoses-GitHub/MMM-ImageSlideshow/blob/master/MMM-ImageSlideshow.js">MMM-ImageSlideshow</a>.

<img src="https://github.com/darickc/MMM-BackgroundSlideshow/blob/master/screenshots/landscape.jpg" style="width: 300px;" />
<img src="https://github.com/darickc/MMM-BackgroundSlideshow/blob/master/screenshots/portait.jpg" style="width: 300px;" />

## Dependencies / Requirements

This module requires that you have an accessable PLEX media server where your photos are stored, and that you have marked some of these photoes as favourites (The Heart icon).

## Operation

This module will log into the specified PLEX Media Server and locate the Favorites Photo Album and display the images. The module will display those images in either alphabetical or random order. Once all the images have been shown, it will loop back and start again.

Extra configurations include setting the amount of time an image is shown for, the transition speed from one image to another, the background sizing, whether or not to animate the transition from one to the other, the gradient used to make the text more readable, and the gradient opacity.

## Installing the module

To install this module, from a SSH terminal

```
cd ~/MagicMirror/modules
git clone https://github.com/PJTewkesbury/MMM-PlexSlideshow.git
cd MMM-PlexSlideshow
npm install
```

To update

```
cd ~/MagicMirror/modules/MMM-PlexSlideShow
git pull
npm install
```

## Configuration

To configure the module, add the module to the modules array in the `config/config.js` file:

```javascript
modules: [
  {
    module: 'MMM-PlexSlideshow',
	position: 'fullscreen_below',
    config: {
	  plex: {
		  hostname:"PlexServerName Or IP",
		  port:32400,
		  username:"",
		  password:"",
		},
        collection: {
          type: "album", // album, tag
          section: "Photos", // name or title of the section
          title: "2018 Halloween" // name of album or tag name.
        },
		transitionImages: true,
    }
  }
];
```

## Notification options

The following notifications can be used:

| Notifications | Description |
|---------------|-------------|
BACKGROUNDSLIDESHOW_NEXT | Change to the next image, restart the timer for image changes only if already running|
BACKGROUNDSLIDESHOW_PAUSE| Pause the timer for image changes|
BACKGROUNDSLIDESHOW_PLAY | Change to the next image and start the timer for image changes|

## Configuration options

The following properties can be configured:

|Option |Description|
|-------|-----------|
|plex   | The connection details for your PLEX server. This is a required value. This is an object of values. See below. |
|plex.hostname | The IP address or hostname of your PLEX server. This is a required value|
|plex.port | This is the port number that your PLEX server runs on. This is required and it's value is normally 32400|
|plex.username | The username of an account that can access the PLEX server.  This is a required value|
|plex.password | The password for the username of an account that can access the PLEX server. This is a required value|
|collection   | The collection details of the Photos that you want to display. This is a required value. This is an object of values. See below. |
|collection.type | The collection type of photos. The values can be either `album` or `tag`. This is a required value|
|collection.section | This is the section or library name for where you store your photos.|
|collection.title | This is the title of your album or tag that you want to use as your filter for the slide show. `Favorites` is an album option.|
|slideshowSpeed|Integer value, the length of time to show one image before switching to the next, in milliseconds. <br> Default value: 10000 (Which is 10 seconds). <br>This value is __OPTIONAL__|
|transitionSpeed|Transition speed from one image to the other, transitionImages must be true. Must be a valid css transition duration.<br> Example: '2s'. <br>This value is __OPTIONAL__|
|backgroundSize|The sizing of the background image. Values can be: <ul><li>cover: Resize the background image to cover the entire container, even if it has to stretch the image or cut a little bit off one of the edges. </il><li>contain: Resize the background image to make sure the image is fully visible.</il></ul> Default value:'cover'. This value is __OPTIONAL___|
|transitionImages|Transition from one image to the other (may be a bit choppy on slower devices, or if the images are too big).<br>Example: true<br>Default value:false <br>This value is __OPTIONAL__|
|gradient|The vertical gradient to make the text more visible.  Enter gradient stops as an array. <br><br> Example: [ <br>"rgba(0, 0, 0, 0.75) 0%",<br>"rgba(0, 0, 0, 0) 40%"<br>]<br><br>Default value:__[<br>"rgba(0, 0, 0, 0.75) 0%",<br>"rgba(0, 0, 0, 0) 40%",<br>"rgba(0, 0, 0, 0) 80%",<br>"rgba(0, 0, 0, 0.75) 100%"<br>]<br>This value is __OPTIONAL__|
|horizontalGradient|The horizontal gradient to make the text more visible.  Enter gradient stops as an array.<br><br>Example:["rgba(0, 0, 0, 0.75) 0%",<br>"rgba(0, 0, 0, 0) 40%"<br>]<br>Default value:___[<br>"rgba(0, 0, 0, 0.75) 0%",<br>"rgba(0, 0, 0, 0) 40%",<br>"rgba(0, 0, 0, 0) 80%",<br>"rgba(0, 0, 0, 0.75) 100%"<br>]<br>This value is __OPTIONAL__|
|gradientDirection|The direction of the gradient<br>Possible values:</b> 'vertical', 'horizontal', 'both'<br><br>Default value:</b>'vertical'<br>This value is __OPTIONAL__|
