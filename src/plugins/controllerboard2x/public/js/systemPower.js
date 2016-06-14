(function(window) {
  'use strict';
  var plugins = namespace('plugins');
  plugins.SystemPower = function(cockpit) {
    var self = this;
    self.cockpit = cockpit;
    console.log("SystemPower Plugin running");

  };

  plugins.SystemPower.prototype.getTelemetryDefintions = function getTelemetryDefintions() {
    return([
      {name: 'vout', description: 'Voltage (mv) measured at the board'},
      {name: 'btti', description: 'Current (ma) measured in to the board via both battery packs'},
      {name: 'BT1I', description: 'Current (ma) measured from port battery tube'},
      {name: 'BT2I', description: 'Current (ma) measured from starboard battery tube'},
      {name: 'SC1I', description: 'Current (ma) measured in to port ESC'},
      {name: 'SC2I', description: 'Current (ma) measured in to vertical ESC'},
      {name: 'SC3I', description: 'Current (ma) measured in to starboard ESC'},
      {name: 'BRDI', description: 'Current (ma) measured at pin A0'},
      {name: 'BRDV', description: 'Voltage (ma) measured at pin A4'},
      {name: 'AVCC', description: 'Voltage reported by MCU'},
      {name: 'SC3I', description: 'Current (ma) measured in to starboard ESC'},
      {name: 'ESCP', description: 'Power to ESCs on/off'},
      {name: 'I2CP', description: 'Power to external I2C bus on/off'}
    ]);
  }

  plugins.SystemPower.prototype.inputDefaults = function inputDefaults(){
    var self = this;
    return [
      // Power on ESC
      {
        name: 'rovPilot.powerOnESC',
        description: 'Switches the ESCs on',
        defaults: { keyboard: '[' },
        down: function () {
          self.cockpit.rov.emit('plugin.systemPower.powerOnESCs');
        }
      },

      // Power off ESC
      {
        name: 'rovPilot.powerOffESC',
        description: 'Switches the ESCs off',
        defaults: { keyboard: ']' },
        down: function () {
          self.cockpit.rov.emit('plugin.systemPower.powerOffESCs');
        }
      },

    ]
  }

  //This pattern will hook events in the cockpit and pull them all back
  //so that the reference to this instance is available for further processing
  plugins.SystemPower.prototype.listen = function listen() {
    var self = this;

    this.cockpit.on('plugin.systemPower.powerOffESCs',function(){
      self.cockpit.rov.emit('plugin.systemPower.powerOffESCs');
    });

    this.cockpit.on('plugin.systemPower.powerOnESCs',function(){
      self.cockpit.rov.emit('plugin.systemPower.powerOnESCs');
    });

    this.cockpit.withHistory.on('status',function(status){
      //Work around not having the explicit status in the MCU code
      if ('log' in status){
        if (status.log.indexOf('log:escpower=') > 0){
          //Check for 1 or 0 and return as an on/off message
          console.log("escpower");
        }
      }

      //TODO: Make sure the firmware sends ESCP
      if ('ESCP' in status){
        var result = true;
        //since we are pulling text values from status we use == instead of ===
        if (status.ESCP == 0) result = false;
        self.cockpit.emit('plugin.systemPower.state',{escs_powered:result});
      }

      var powerObject = window.controllerboard2x.telemetryToSystemPower(status);
      if (powerObject !== null) { self.cockpit.emit('plugin.controllerboard2x.systemPower.update',powerObject)};
    });

  };

  window.Cockpit.plugins.push(plugins.SystemPower);

})(window);
