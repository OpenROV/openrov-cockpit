var OFFSET = 1500;
var ArduinoHelper = function () 
{
  var result = {};
  var physics = {};
  var serial = {};
  
  result.mapA = function(x, in_min, in_max, out_min, out_max) {
    return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
  };
  
  result.limit = function(value, l, h) {
    // truncate anything that goes outside of max and min value
    return Math.max(l, Math.min(h, value));
  };
  
  //For mapping to the motor Microseconds range from 1000 to 2000. This
  //is mostly a pass through for now as we want to keep the numbers consistent
  //from the UI to the controller for ease of troubleshooting for now.
  //Perhaps we will shift the range to -500..0..500 in the future.
  physics.mapRawMotor = function (val) {
    val = result.limit(val, -1, 1);
    val = result.mapA(val, -1, 1, 1000, 2000);
    val = Math.round(val);
    return val;
  };
  
  physics.unmapMotor = function (val) {
    val = result.mapA(val, 1000, 2000, -1, 1);
  };
  
  physics.mapMotors = function (throttle, yaw, vertical) {
    var port = 0, starbord = 0;
    port = starbord = throttle;
    port += yaw;
    starbord -= yaw;
    return {
      port: physics.mapRawMotor(port),
      starbord: physics.mapRawMotor(starbord),
      vertical: physics.mapRawMotor(vertical)
    };
  };
  
  physics.mapVoltageReading = function (voltage) {
    return result.mapA(voltage, 0, 1023, 0, 50);
  };
  
  //INA169 calculation, VOUT = (IS) (RS) (1000µA/V) (RL)
  physics.mapCurrentReading = function (voltage) {
    return result.mapA(voltage, 0, 1023, 0, 5) + 0.4;  //add offset
  };

  physics.mapLight = function (value) {
    return result.mapA(value, 0, 1, 0, 255);
  };

  serial.packPercent = function (value) {
    return Math.floor(value*100);
  };
  

  
  result.serial = serial;
  result.physics = physics;
  return result;
};


module.exports = ArduinoHelper;
