(function(window) {
  'use strict';
  var plugins = namespace('plugins');
  plugins.ExternalLights = function(cockpit) {
    var self = this;
    self.cockpit = cockpit;


    $('rov-ui-standard')[0].getNavBar().find('brightness-indicator').hide();
    $('rov-ui-standard')[0].getNavBar().find('brightness-indicator').after('<external-brightness-indicator></external-brightness-indicator>');
    
    var jsFileLocation = urlOfJsFile('externallights.js');
    Polymer.import( [jsFileLocation + '../webcomponents/external-brightness-indicator.html'], function() {
      //replace old light indicator
    });
    
      

  };

  //This pattern will hook events in the cockpit and pull them all back
  //so that the reference to this instance is available for further processing
  plugins.ExternalLights.prototype.listen = function listen() {
    var self = this;

    //TODO: Map all functions with keyboard and headsup
    self.cockpit.extensionPoints.inputController.register(
      [
        // lights increment
        {
          name: 'plugin.externalLights.adjust_increment',
          description: 'Makes the ROV lights brighter.',
          defaults: { keyboard: ''},
          down: function () {
            cockpit.rov.emit('plugin.externalLights.adjust', 0.1);
          }
        },

        // lights decrement
        {
          name: 'plugin.externalLights.adjust_increment',
          description: 'Makes the ROV lights dimmer.',
          defaults: { keyboard: ''},

          down: function () {
            cockpit.rov.emit('plugin.externalLights.adjust', -0.1);
          }
        },

        // lights toggle
        {
          name: 'plugin.externalLights.toggle',
          description: 'Toggles the ROV lights on/off.',
          defaults: { keyboard: '6' },
          down: function () {
            cockpit.rov.emit('plugin.externalLights.toggle');
          }
        }

      ]);


      //Listen for the existing events from the standard light
      //component and route it to our webcomponent for display
      self.cockpit.rov.on('plugin.lights.level', function(level) {
        self.internal_brightnessLevel = Math.ceil(level*10); //trim off the level text that needs to be fixed
         $('rov-ui-standard')[0].getNavBar().find('external-brightness-indicator')[0].internal_brightnessLevel = self.internal_brightnessLevel;
      });

      self.cockpit.rov.on('plugin.externalLights.level', function(level) {
        self.external_brightnessLevel = Math.ceil(level*10); //turn to 0..100 percent int
         $('rov-ui-standard')[0].getNavBar().find('external-brightness-indicator')[0].external_brightnessLevel = self.external_brightnessLevel;

      });

  };

  window.Cockpit.plugins.push(plugins.ExternalLights);

})(window);
