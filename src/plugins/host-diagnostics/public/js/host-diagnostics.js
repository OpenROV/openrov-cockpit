(function (window, $, undefined) {
  'use strict';

  var HostDiagnostics;
  HostDiagnostics = function HostDiagnostics(cockpit) {
    console.log('Loading HostDiagnostics plugin in the browser.');
    // Instance variables
    this.cockpit = cockpit;
    this.cockpit_events = 0;
    this.rov_events = 0;
    this.rov_socketevents = 0;
  };
  HostDiagnostics.prototype.listen = function listen() {
    var self = this;
    //For counting events
    this.cockpit.onAny(function () {
      self.cockpit_events++;
    });
    this.cockpit.rov.onAny(function () {
      self.rov_events++;
    });

    setInterval(function () {
      self.cockpit.emit('plugin.host-diagnostics.event-counts', {
        cockpit: self.cockpit_events,
        rov: self.rov_events,
        socketIO: self.rov_socketevents
      });
      self.cockpit_events = 0;
      self.rov_events = 0;
      self.rov_socketevents = 0;
    }, 1000);  //end For counting events
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
  };
  window.Cockpit.plugins.push(HostDiagnostics);

  
}(window, jQuery));