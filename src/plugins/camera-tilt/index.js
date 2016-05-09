(function() {
  function CameraTilt(name, deps) {
    var ArduinoHelper = require('../../lib/ArduinoHelper')();
    console.log('Camera tilt plugin loaded');
    var tilt = 0;
    var physics = ArduinoHelper.physics;
    this.positiveRangeLimit = .7;
    this.negativeRangeLimit = -.7;
    var self=this;

    deps.globalEventLoop.withHistory.on('settings-change.cameratilt', function(value){
        self.positiveRangeLimit=value.cameratilt.positiveRange;
        self.negativeRangeLimit=value.cameratilt.negativeRange;
    });

    // Cockpit
    deps.cockpit.on('plugin.cameraTilt.set', function (angle) {
      setCameraTilt(angle);
    });

    deps.cockpit.on('plugin.cameraTilt.adjust', function (value) {
      adjustCameraTilt(value);
    });

    // Arduino
    deps.rov.on('status', function (data) {
      if ('servo' in data) {
        var angle = 90 / 500 * data.servo * -1 - 90;
        deps.cockpit.emit('plugin.cameraTilt.angle', angle);
      }
    });

    var mapTiltServo = function (value) {
      value = ArduinoHelper.limit(value, self.negativeRangeLimit, self.positiveRangeLimit);
      return ArduinoHelper.mapA(value, -1, 1, 1000, 2000);
    };

    var setCameraTilt = function(value) {
      tilt = value;
      if (tilt > 1)
        tilt = 1;
      if (tilt < -1)
        tilt = -1;

      var servoTilt = mapTiltServo(tilt);
      var command = 'tilt(' + servoTilt + ')';

      console.log( "tilt:" + servoTilt );

      deps.rov.send(command);
    };

    var adjustCameraTilt = function(value) {
      tilt += value;
      setCameraTilt(tilt);
    };
  }

  CameraTilt.prototype.getSettingSchema = function getSettingSchema(){
  //from http://json-schema.org/examples.html
    return [{
  	"title": "Camera Tilt",
  	"type": "object",
    "id": "cameratilt", //Added to support namespacing configurations
  	"properties": {
  		"positiveRange": {
  			"type": "number",
        "default" : ".7" //Added default
  		},
  		"negativeRange": {
  			"type": "number",
        "default" : "-.7" //Added default
  		}
  	},
  	"required": ["positiveRange", "negativeRange"]
  }];
  };

  module.exports = function (name, deps) {
    return new CameraTilt(name,deps);
  };
})();
