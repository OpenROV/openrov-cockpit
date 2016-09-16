(function () {
  function ExternalLights(name, deps) {
    console.log('ExternalLights plugin loaded');
    var self = this;
    self.settings = [
      0,
      0
    ];
    //  Settings:       = [ 0 .. 5 ]
    self.levelMap = [
      0,
      16,
      32,
      64,
      128,
      255
    ];
    self.maxLevel = self.levelMap.length - 1;
    // Cockpit
    deps.cockpit.on('plugin.externalLights.toggle', function (lightNum) {
      toggleLights(lightNum);
    });
    deps.cockpit.on('plugin.externalLights.adjust', function (lightNum, value) {
      adjustLights(lightNum, value);
    });
    deps.cockpit.on('plugin.externalLights.set', function (lightNum, value) {
      setLights(lightNum, value);
    });
    deps.cockpit.on('plugin.externalLights.setOnOff', function (lightNum, setOn) {
      if (setOn) {
        // Max light power
        setLights(lightNum, self.maxLevel);
      } else {
        // Min light power
        setLights(lightNum, 0);
      }
    });
    // Arduino
    deps.globalEventLoop.on('mcu.status', function (data) {
      if ('LIGTE0' in data) {
        // Value of 0-255 representing percent
        var level = parseInt(data.LIGTE0);
        console.log('External light 0 status: ' + level);
        // Search for the level in the level map
        var setting = self.levelMap.indexOf(level);
        if (setting != -1) {
          // The new setting value is the array index of the level in the level map, if it exists
          self.settings[0] = setting;
          console.log('External light 0 setting: ' + setting);
        } else {
          // Find the closest level in our map
          var closest = self.levelMap.reduce(function (prev, curr) {
              return Math.abs(curr - level) < Math.abs(prev - level) ? curr : prev;
            });
          // Set the new setting value based on the index of the closest level
          self.settings[0] = self.levelMap.indexOf(closest);
          console.log('External light 0 closest setting: ' + self.settings[0]);
        }
        deps.cockpit.emit('plugin.externalLights.state', 0, { level: self.settings[0] });
      } else if ('LIGTE1' in data) {
        // Value of 0-255 representing percent
        var level = parseInt(data.LIGTE1);
        console.log('External light 1 status: ' + level);
        // Search for the level in the level map
        var setting = self.levelMap.indexOf(level);
        if (setting != -1) {
          // The new setting value is the array index of the level in the level map, if it exists
          self.settings[1] = setting;
        } else {
          // Find the closest level in our map
          var closest = self.levelMap.reduce(function (prev, curr) {
              return Math.abs(curr - level) < Math.abs(prev - level) ? curr : prev;
            });
          // Set the new setting value based on the index of the closest level
          self.settings[1] = self.levelMap.indexOf(closest);
        }
        deps.cockpit.emit('plugin.externalLights.state', 1, { level: self.settings[1] });
      }
    });
    var adjustLights = function adjustLights(lightNum, value) {
      // Modify current setting
      setLights(lightNum, self.settings[lightNum] + value);
    };
    var toggleLights = function toggleLights(lightNum) {
      if (self.settings[lightNum] > 0) {
        // Set to min power
        setLights(lightNum, 0);
      } else {
        // Set to max power
        setLights(lightNum, self.maxLevel);
      }
    };
    var setLights = function setLights(lightNum, value) {
      console.log('Attemping to set lights [' + lightNum + '] to: ' + value);
      // Range limit the new setting from 0 to the max number of defined levels
      if (value < 0) {
        value = 0;
      } else if (value >= self.maxLevel) {
        value = self.maxLevel;
      }
      // Make sure the new setting is an integer
      self.settings[lightNum] = Math.round(value);
      console.log('Setting lights [' + lightNum + '] to: ' + self.settings[lightNum]);
      var command = 'elight' + lightNum + '(' + self.levelMap[self.settings[lightNum]] + ')';
      deps.globalEventLoop.emit('mcu.SendCommand', command);
    };
  }
  module.exports = function (name, deps) {
    return new ExternalLights(name, deps);
  };
}());