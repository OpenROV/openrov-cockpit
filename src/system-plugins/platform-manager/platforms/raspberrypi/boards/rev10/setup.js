const fs            = require('fs');
const path          = require('path');
const spawn         = require('child_process').spawn;
const SerialBridge  = require('TridentSerialBridge.js');
var logger          = require('AppFramework.js').logger;
var debug = {};

var SetupBoardInterface = function(board) 
{
    debug = board.debug;

    console.log( "Creating bridge" );

    // Decorate the MCU interface with board specific properties
    board.bridge = new SerialBridge( '/dev/ttyAMA0', 500000 );

    board.statusdata = {};

    console.log( "Setting up bridge" );

    // ------------------------------------------------
    // Setup private board methods
    // ------------------------------------------------

    // Setup bridge interface event handlers
    board.bridge.on('serial-recieved', function(data) 
    {
        board.global.emit(board.interface + '.serialRecieved', data);
    });

    board.bridge.on('status', function(status) 
    {
        // Re-emit status data for other subsystems
        board.global.emit( board.interface + '.status', status );
    });

    console.log( "Setting up API" );

    // ------------------------------------------------
    // Setup Public API	
    RegisterFunctions(board);
    
    // Call initialization routine
    board.global.emit('mcu.Initialize');

    console.log( "Setting up statemachine" );

    // Create and start statemachine
    board.fsm = require( './statemachine.js' )( board );
    board.fsm._e_init();

    console.log( "Done" );
};

// ------------------------------------------------
// Public API Definitions	
// ------------------------------------------------
var RegisterFunctions = function(board) 
{
   board.AddMethod('Initialize', function () 
  {
    logger.debug('MCU Interface initialized!');

    // TODO: Only allow the statemachine to do this
    // Turn on the serial
    board.global.emit('mcu.StartSerial');
  }, false);

  board.AddMethod('ResetMCU', function (path) 
  {
    // Trigger an MCU reset
    board.fsm._e_trigger_mcu_reset_user();
  }, false);

  board.AddMethod('SendCommand', function( command ) 
  {
    board.bridge.write( command + ';' );
  }, false);

  // Forward cockpit commands to the global bus to be sent to the firmware
  board.cockpit.on("mcu.SendCommand",function( commandIn )
  {
    board.global.emit("mcu.SendCommand", commandIn );
  });

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
    console.log( "StartSerial" );
    board.bridge.connect();
  }, false);

  board.AddMethod('StopSerial', function () 
  {
    // Close the bridge connection
    board.bridge.close();
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