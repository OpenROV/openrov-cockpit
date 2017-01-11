(function (window) {
  'use strict';
  var plugins = namespace('plugins');
  plugins.navigationData = function (cockpit) {
    var self = this;
    self.cockpit = cockpit;
    
    this.actions = 
    {
      'plugin.navigationData.toggleHeadsUpDisplay':
      {
        description: "Toggle HUD",
        controls:
        {
          button:
          {
            down: function() {
              cockpit.emit('plugin.navigationData.toggleHeadsUpDisplay');
            }           
          }
        }
      }
    };

    this.inputDefaults = 
    {
      keyboard:
      {
        "": { type: "button",
                action: 'plugin.navigationData.toggleHeadsUpDisplay' }
      }
    };
  };
  plugins.navigationData.prototype.getTelemetryDefinitions = function getTelemetryDefinitions() {
    return [
      {
        name: 'depth_d',
        description: 'Depth in meters'
      },
      {
        name: 'imu_p',
        description: 'Pitch in degrees -180 to 180'
      },
      {
        name: 'imu_r',
        description: 'Roll in degrees -90 to 90'
      },
      {
        name: 'imu_y',
        description: 'Heading in degrees -180 to 180'
      },
      {
        name: 'fthr',
        description: 'Forward thrust power in percent of total thrust'
      }
    ];
  };
  //This pattern will hook events in the cockpit and pull them all back
  //so that the reference to this instance is available for further processing
  plugins.navigationData.prototype.listen = function listen() {
    var self = this;
    this.cockpit.rov.withHistory.on('plugin.navigationData.data', function (navdata) {
      self.cockpit.emit('plugin.navigationData.data', navdata);
    });

    this.cockpit.rov.withHistory.on('plugin.navigationData.state', function (state){
      self.cockpit.emit('plugin.navigationData.state', state);
    })

    this.cockpit.on('plugin.navigationData.setState', function (state){
      self.cockpit.rov.emit('plugin.navigationData.setState', state);
    })

  };
  window.Cockpit.plugins.push(plugins.navigationData);
}(window));