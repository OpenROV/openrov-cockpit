(function (window, $, undefined) {
  'use strict';
  var Photocapture;
  Photocapture = function Photocapture(cockpit) {
    console.log('Loading Photocapture plugin in the browser.');
    // Instance variables
    this.cockpit = cockpit;
    this.activeCanvas = null;
  };
  //This pattern will hook events in the cockpit and pull them all back
  //so that the reference to this instance is available for further processing
  Photocapture.prototype.listen = function listen() {
    var self = this;

    this.cockpit.withHistory.on('video.forward.canvas-changed',function(canvas){
      self.activeCanvas = canvas;
    });
  };

  Photocapture.prototype.downloadVideoAsPhoto = function downloadVideoAsPhoto(){
    var image = this.activeCanvas.toDataURL("image/jpeg").replace("image/jpeg", "image/octet-stream"); //Convert image to 'octet-stream' (Just a download, really)
    window.location.href = image;
  }

  Photocapture.prototype.inputDefaults = function inputDefaults(){
    var self = this;
    return [
      {
        name: 'photoCapture.takeSnapshot',
        description: 'Take a snapshot of the current video image.',
        defaults: { keyboard: 'c', gamepad: 'LB' },
        down: function() { self.downloadVideoAsPhoto() }
      }
    ]
  };

  window.Cockpit.plugins.push(Photocapture);
}(window, jQuery));
