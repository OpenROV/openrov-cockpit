(function (window, document, jQuery) {
  'use strict';
  var MjpegVideo;
  // Register plugin
  var plugins = namespace('plugins');
  plugins.MjpegVideo = MjpegVideo;
  MjpegVideo = function MjpegVideo(cockpit) {
    console.log('Loading MjpegVideo plugin in the browser.');
    var self = this;
    this.cockpit = cockpit;
    this.rov = cockpit.rov;
    this.pluginDefaults = {
      name: 'MjpegVideo',
      viewName: 'MjpegVideo plugin',
      canBeDisabled: false,
      defaultEnabled: true
    };
    this.cameras = {};
    var cameraRolling = false;
    // Whenever a new channel comes online, register its event listeners
    this.rov.withHistory.on('plugin.mjpeg-video.deviceRegistration', function (cameras) {
      if (!cameraRolling && cameras.length > 0) {
        // start the first camera
        // TODO we should be able to configure this
        var cam = cameras[0];
        self.rov.emit('plugin.mjpeg-video.start', cam.deviceid);
      }
    });
    this.rov.withHistory.on('plugin.mjpeg-video.cameraInfo', function (cameras) {
      if (cameras) {
        cameras.forEach(function (camera) {
          if (!self.cameras[camera.device]) {
            self.cameras[camera.device] = camera;
          }
        });
        if (!cameraRolling && cameras.length > 0) {
          // start the first camera
          // TODO we should be able to configure this
          var cam = cameras[0];
          self.rov.emit('plugin.mjpeg-video.start', cam.device);
        }
      }
    });
    this.rov.withHistory.on('plugin.mjpeg-video.cameraInfo', function (cameras) {
    });
  };
  MjpegVideo.prototype.inputDefaults = function inputDefaults() {
    var self = this;
    return [];
  };
  window.Cockpit.plugins.push(MjpegVideo);
}(window, document, $));