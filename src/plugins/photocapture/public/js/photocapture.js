(function (window, $, undefined) {
  'use strict';
  var Photocapture;
  Photocapture = function Photocapture(cockpit) {
    console.log('Loading Photocapture plugin in the browser.');
    // Instance variables
    this.cockpit = cockpit;
  };
  //This pattern will hook events in the cockpit and pull them all back
  //so that the reference to this instance is available for further processing
  Photocapture.prototype.listen = function listen() {
    var photoc = this;

  };

  Photocapture.prototype.inputDefaults = function inputDefaults(){
    return [
      {
        name: 'photoCapture.takeSnapshot',
        description: 'Take a snapshot of the current video image.',
        defaults: { keyboard: 'c', gamepad: 'LB' },
        down: function() { photoc.cockpit.rov.emit('plugin.photoCapture.snapshot'); }
      }
    ]
  };

  window.Cockpit.plugins.push(Photocapture);
}(window, jQuery));
