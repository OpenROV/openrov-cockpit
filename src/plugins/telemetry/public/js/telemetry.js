(function (window, $, undefined) {
  'use strict';
  var Telemetry;
  Telemetry = function Telemetry(cockpit) {
    console.log('Loading Telemetry plugin in the browser.');
    // Instance variables
    this.cockpit = cockpit;
    this.importantTelemetry = {};
    this.textcolor = 0;
    this.definitions = {};
    // Add required UI elements
    //cockpit.extensionPoints.keyboardInstructions.append('<p><i>h</i> to cycle text color of telemetry</p>');
  };
  //This pattern will hook events in the cockpit and pull them all back
  //so that the reference to this instance is available for further processing
  Telemetry.prototype.listen = function listen() {
    var self = this;
    /*
    self.cockpit.extensionPoints.inputController.register(
      {
        name: 'telemetry.cycleTextColor',
        description: 'Cycle the text color of telemetry.',
        defaults: { keyboard: 'h' },
        down: function() { cockpit.rov.emit('plugin.telemetry.cycleTextColor'); }
      });
*/
    self.cockpit.rov.on('telemetry.getDefinition',function(name,callback){
      if (self.definitions[name]!==undefined){
        callback(self.definitions[name]);
      } else {
        callback({name: name});
      }
    });

    self.cockpit.rov.on('plugin.telemetry.logData',function(data){
      self.cockpit.emit('plugin.telemetry.logData',data);
    });

    self.cockpit.rov.on('telemetry.registerDefinition',function(data){
      if('name' in data){
        self.definitions[data.name]=data;
      }
    });

    /* Crawl the plugins looking for those with telemetry definitions */
    self.cockpit.loadedPlugins.forEach(function(plugin){
      var defobject = self.definitions;
      if (plugin.getTelemetryDefintions !== undefined){
        plugin.getTelemetryDefintions().forEach(function(data){
          if('name' in data){
            defobject[data.name]=data;
          }
        });
      }
    });


  };
  window.Cockpit.plugins.push(Telemetry);
}(window, jQuery));
