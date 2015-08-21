(function (window, $, undefined) {
  'use strict';
  var HostDiagnostics;
  HostDiagnostics = function HostDiagnostics(cockpit) {
    console.log('Loading HostDiagnostics plugin in the browser.');
    // Instance variables
    this.cockpit = cockpit;
  };
  HostDiagnostics.prototype.listen = function listen() {
/*
    // Toggle FPS counter
    this.cockpit.extensionPoints.inputController.register(
      {
        name: 'fpsCounter.toggleFpsCounter',
        description: 'Shows/hides the FPS counter for the video steam.',
        defaults: { keyboard: 'f' },
        down: function() { _fpscounter.toggleDisplay(); }
      });
*/
  };
  HostDiagnostics.prototype.toggleDisplay = function toggleDisplay() {
    //This has been working so not going to refactor to make jshint happy just yet
//    this.meter.isPaused ? this.meter.show() : this.meter.hide(); /* jshint ignore:line */
  };
  window.Cockpit.plugins.push(HostDiagnostics);
}(window, jQuery));
