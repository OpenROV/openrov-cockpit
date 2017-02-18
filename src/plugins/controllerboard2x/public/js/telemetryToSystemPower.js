//This module is designed to run in either Node or the browser per
//http://www.richardrodger.com/2013/09/27/how-to-make-simple-node-js-modules-work-in-the-browser/#.Vipl8GQrJ24
'use strict';
(function () 
{
  var root = this;
  var controllerboard2x = 
  {
    telemetryToSystemPower: function telemetryToSystemPower(data) 
    {
      var result = 
      {
        board: {},
        battery: { current: {} },
        esc: {}
      };

      var foundData = false;

      //convert to typed values
      if ('batt_v' in data) 
      {
        result.board.voltage = parseFloat(data.batt_v)/1000.0;
	foundData = true;
      }

      if ('btti' in data) 
      {
        result.board.current = parseFloat(data.btti);
        foundData = true;
      }

      if ('BT1I' in data) 
      {
        result.battery.current.port = parseFloat(data.BT1I);
        foundData = true;
      }

      if ('BT2I' in data) 
      {
        result.battery.current.starboard = parseFloat(data.BT2I);
        foundData = true;
      }

      if ('SC1I' in data) 
      {
        result.esc.port = parseFloat(data.SC1I);
        foundData = true;
      }

      if ('SC2I' in data) 
      {
        result.esc.vertical = parseFloat(data.SC2I);
        foundData = true;
      }

      if ('SC3I' in data) 
      {
        result.esc.starboard = parseFloat(data.SC3I);
        foundData = true;
      }

      if (!foundData)
      {
        return null;
      }

      return result;
    }
  };

  if (typeof exports !== 'undefined') 
  {
    if (typeof module !== 'undefined' && module.exports) 
    {
      exports = module.exports = controllerboard2x;
    }

    exports.controllerboard2x = controllerboard2x;
  } 
  else 
  {
    root.controllerboard2x = controllerboard2x;
  }
}.call(this));  // On the browser, 'this' is the window object
