var Promise         = require('bluebird');
var fs              = Promise.promisifyAll(require('fs-extra'));
var execFileAsync   = require('child-process-promise').execFile;
var path            = require('path');
var spawn           = require('child_process').spawn;
var ArduinoBuilder  = require('ArduinoBuilder');
var ArduinoHelper   = require('ArduinoHelper');
var Hardware        = require('./bridge.js');
var logger          = require('AppFramework.js');
var debug           = {};

var SetupBoardInterface = function (board) 
{
  debug = board.debug;

  // Decorate the MCU interface with board specific properties
  board.physics         = new ArduinoHelper().physics;
  board.bridge          = new Hardware();
  board.firmwareVersion = 0;
  board.statusdata      = {};

  board.hashInfo        = 
  {
    fromBin: "",
    fromMCU: ""
  };

  board.settingsCollection = 
  {
    smoothingIncriment: 0,
    deadZone_min: 0,
    deadZone_max: 0
  };

  // ------------------------------------------------
  // Setup private board methods

  board.notSafeToControl = function () 
  {
    // TODO: Implement. for now, default to controllable
    return false;
  };

  board.requestSettings = function () 
  {
    //todo: Move to a settings manager
    var command = 'reportSetting();';
    board.bridge.write(command);

    command = 'rmtrmod();';
    board.bridge.write(command);
  };

  // TODO: Move the water setting to diveprofile
  board.updateSetting = function () 
  {

    // This is the multiplier used to make the motor act linear fashion.
    // For example: the props generate twice the thrust in the positive direction than the negative direction.
    // To make it linear we have to multiply the negative direction * 2.
    var command = 'updateSetting('
      + board.vehicleConfig.preferences.get('smoothingIncriment') + ',' 
      + board.vehicleConfig.preferences.get('deadzone_neg') + ',' 
      + board.vehicleConfig.preferences.get('deadzone_pos') + ');';

    board.bridge.write(command);
  };

  // ------------------------------------------------
  // Setup bridge interface event handlers

  board.bridge.on('serial-recieved', function (data) 
  {
    board.global.emit(board.interface + '.serialRecieved', data);
  });

  board.bridge.on('status', function (status) 
  {
    // Clear old status data
    board.statusdata = {};

    // Copy new status data 
    for (var i in status) 
    {
      board.statusdata[i] = status[i];
    }

    // Re-emit status data for other subsystems
    board.global.emit(board.interface + '.status', board.statusdata);

    // Firmware version
    if ('ver' in status) 
    {
      var regex = /<<{{(.*)}}>>/;
      var matches = regex.exec( status.ver );

      try
      {
        board.hashInfo.fromMCU = matches[1];
        logger.debug( "Ver report: " + board.hashInfo.fromMCU );
      }
      catch( err )
      {
        logger.error( "Version regex found no matches" )
      }
    }

    // Settings update   
    if ('TSET' in status) 
    {
      var setparts = status.settings.split(',');
      board.settingsCollection.smoothingIncriment = setparts[0];
      board.settingsCollection.deadZone_min = setparts[1];
      board.settingsCollection.deadZone_max = setparts[2];
      board.global.emit(board.interface + '.firmwareSettingsReported', board.settingsCollection);
    }

    // Command request
    if ('cmd' in status) 
    {
      // Re-emit all commands except ping
      if (status.com != 'ping(0)') 
      {
        board.global.emit(board.interface + '.command', status.cmd);
      }
    }

    // Log entry
    if ('log' in status)
    {
    }

    // Initial boot notification
    if ('boot' in status) 
    {
      board.updateSetting();
      board.requestSettings();
    }
  });
  // ------------------------------------------------
  // Setup Public API	
  RegisterFunctions(board);
  
  // Call initialization routine
  board.global.emit('mcu.Initialize');

  // Create and start statemachine
  board.fsm = require( './statemachine.js' )( board );
  board.fsm._e_init();
};

// ------------------------------------------------
// Public API Definitions	
// ------------------------------------------------

var RegisterFunctions = function (board) 
{
  board.AddMethod('Initialize', function () 
  {
    debug('MCU Interface initialized!');

    // TODO: Only allow the statemachine to do this
    // Turn on the serial
    board.global.emit('mcu.StartSerial');
  }, false);

  board.AddMethod('ResetMCU', function (path) 
  {
    // Trigger an MCU reset
    board.fsm._e_trigger_mcu_reset_user();
  }, false);

  board.AddMethod('FlashESCs', function (path) 
  {
    // Trigger a reflash of the ESC firmware
    board.fsm._e_trigger_esc_flash_user();
  }, false);

  board.AddMethod('RebuildMCUFirmware', function (path) 
  {
    // Trigger a rebuild and reflash of the MCU firmware
    board.fsm._e_trigger_firmware_build_user();
  }, false); 

  board.AddMethod('UpdateFirmware', function (path) 
  {
    // Reset the firmware update state machine. Will check updates for everything
    board.fsm._e_reset();
  }, false);

  board.AddMethod('SendCommand', function( command ) 
  {
    if( board.notSafeToControl() ) 
    {
      return;
    }

    board.bridge.write( command + ';' );
  }, false);

  board.cockpit.on("mcu.SendCommand",function( commandIn ){
    board.global.emit("mcu.SendCommand", commandIn );
  });

  board.AddMethod('SendMotorTest', function (port, starboard, vertical) 
  {
    // The 1 bypasses motor smoothing
    var command = 'go(' 
                    + board.physics.mapRawMotor(port) 
                    + ',' + board.physics.mapRawMotor(vertical) 
                    + ',' + board.physics.mapRawMotor(starboard) + ',1)';

    board.bridge.write(command + ';');
  }, false);

  board.AddMethod('RegisterPassthrough', function (config) 
  {
    if(config) 
    {
      if (!config.messagePrefix) 
      {
        throw new Error('You need to specify a messagePrefix that is used to emit and receive message.');
      }

      var messagePrefix = config.messagePrefix;

      // Route specific status messages from the firmware to plugins interested in them
      if (config.fromROV) 
      {
        if (Array.isArray(config.fromROV)) 
        {
          config.fromROV.forEach(function (item) 
          {
            // Register listener to forward from MCU to Cockpit
            board.global.on(board.interface + '.status', function (data) 
            {
              if (item in data) 
              {
                board.cockpit.emit(messagePrefix + '.' + item, data[item]);
              }
            });
          });
        } 
        else 
        {
          throw new Error('config.fromROV needs to be an array.');
        }
      }

      // Route commands to the bridge
      if (config.toROV) 
      {
        if (Array.isArray(config.toROV)) 
        {
          config.toROV.forEach(function (item) 
          {
            // Register listener to forward from cockpit to MCU
            board.cockpit.on(messagePrefix + '.' + item, function (data) 
            {
              var args = Array.isArray(data) ? data.join() : data;
              var command = item + '(' + args + ')';
              board.send(command);
            });
          });
        } 
        else 
        {
          throw new Error('config.toROV needs to be an array.');
        }
      }
    }
  }, false);

  board.AddMethod('StartSerial', function () 
  {
    // Connect to the MCU
    board.bridge.connect();

    // Every few seconds we check to see if settings changes on the arduino.
    // This handles the cases where we have garbled communication or a firmware update of the arduino.
    board.safeCheck = setInterval(function ()
     {
      if (board.notSafeToControl() === false) 
      {
        return;
      }

      board.updateSetting();
      board.requestSettings();
    }, 1000);
  }, false);

  board.AddMethod('StopSerial', function () 
  {
    // Close the bridge connection
    board.bridge.close();
    // Remove the safeCheck interval
    clearInterval( board.safeCheck );
  }, false);

  board.AddMethod('StartRawSerial', function () 
  {
    board.bridge.startRawSerialData();
  }, false);

  board.AddMethod('StopRawSerial', function () 
  {
    board.bridge.stopRawSerialData();
  }, false);
};
module.exports = SetupBoardInterface;