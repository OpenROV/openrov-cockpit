(function (window) {
  'use strict';
  var plugins = namespace('plugins');
  plugins.SystemEnvironment = function (cockpit) {
    var self = this;
    self.cockpit = cockpit;
    console.log('SystemEnvironment Plugin running');
  };
  plugins.SystemEnvironment.prototype.getTelemetryDefintions = function getTelemetryDefintions() {
    return [
      {
        name: 'FMEM',
        description: 'Free memory (bytes) reported by the MCU'
      },
      {
        name: 'TIME',
        description: 'Uptime (ms) reported by the MCU'
      },
      {
        name: 'UTIM',
        description: 'Uptime (ms) reported by the MCU'
      },
      {
        name: 'BRDT',
        description: 'Air temperature (degrees C) reported Arduino'
      },
      {
        name: 'CPU',
        description: 'CPU Utilization percentage'
      },
      {
        name: 'CPUUSAGE',
        description: 'CPU Utilization percentage'
      }
    ];
  };
  //This pattern will hook events in the cockpit and pull them all back
  //so that the reference to this instance is available for further processing
  plugins.SystemEnvironment.prototype.listen = function listen() {
    var self = this;
    //Status messages only come out a 1hz from the Node layer but it contains
    //an entire copy of the state information from the ROV.
    this.cockpit.withHistory.on('status', function (data) {
      //      self.cockpit.emit('plugin.cameraTilt.angle',angle);
      var state = {
          mcu: {},
          cpu: {}
        };
      //Remove once the Arduino firmware is updated to use utim
      if ('time' in data) {
        var formattedRuntime = msToTime(data.time);
        state.mcu.runTime = formattedRuntime;
      }
      if ('utim' in data) {
        var formattedRuntime = msToTime(data.utim);
        state.mcu.runTime = formattedRuntime;
      }
      if ('cpu' in data) {
        state.cpu.utilization = data.cpu;
      }
      //Removed once the node code is changed to send cpu
      if ('cpuUsage' in data) {
        state.cpu.utilization = data.cpuUsage;
      }
      if ('mcu' in data) {
        state.mcu.utilization = data.mcuUsage;
      }
      if ('fmem' in data) {
        state.mcu.freememory = data.fmem;
      }
      cockpit.emit('systemEnvironment.state', state);
    });
  };
  window.Cockpit.plugins.push(plugins.SystemEnvironment);
}(window));