(function (window, $, undefined) {
  'use strict';
  var consoleRecorder = [];
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

    this.cockpit.on("plugin.host-diagnostics.getbrowserlogs",function(callback){
      callback(consoleRecorder);
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


function takeOverConsole(){
    var console = window.console
    if (!console) return
    function intercept(method){
        var original = console[method]
        console[method] = function(){
            // do sneaky stuff
            consoleRecorder.push({timestamp:Date.now(),msg:Array.prototype.slice.apply(arguments).join(' ')});
            if (consoleRecorder.length>500){
              consoleRecorder.shift();
            }
            if (original.apply){
                // Do this for normal browsers
                original.apply(console, arguments)
            }else{
                // Do this for IE
                var message = Array.prototype.slice.apply(arguments).join(' ')
                original(message)
            }
        }
    }
    var methods = ['log', 'warn', 'error']
    for (var i = 0; i < methods.length; i++)
        intercept(methods[i])
}
takeOverConsole();
  
}(window, jQuery));