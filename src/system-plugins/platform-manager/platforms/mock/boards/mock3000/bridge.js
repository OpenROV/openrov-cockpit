var EventEmitter = require('events').EventEmitter;
var debug = require('debug')('bridge');

// Encoding helper functions
function encode( floatIn )
{
    return parseInt( floatIn * 1000 );
}

function decode( intIn )
{
    return ( intIn * 0.001 );
}

function Bridge() 
{
  var DISABLED = 'DISABLED';
  var bridge = new EventEmitter();
  var reader = new StatusReader();
  var emitRawSerial = false;

  // Initial values
  var time = 1000;
  var currentDepth = 1;
  var currentHeading = 0;
  var currentPitch = 0;
  var currentRoll = 0;
  var currentServo = 1500;
  var current = 2;

  bridge.depthHoldEnabled = false;
  bridge.targetHoldEnabled = false;
  bridge.laserEnabled = false;

  // -----------------------------------------
  // Methods
  bridge.write = function (command) 
  {
    var commandParts = command.split(/\(|\)/);
    var commandText = commandParts[0];

    switch (commandText) 
    {
      case 'version': 
      {
        bridge.emitStatus('ver:<<{{10024121ae3fa7fc60a5945be1e155520fb929dd}}>>');
        debug('ver:<<{{10024121ae3fa7fc60a5945be1e155520fb929dd}}>>');
        break;
      }

      case 'ex_hello': 
      {
        var helloGoodbye = parseInt( commandParts[1] );

        if( helloGoodbye === 1 )
        {
          bridge.emitStatus('example:Hello!;');
        }
        else
        {
          bridge.emitStatus('example:Goodbye!;');
        }
        
        break;
      }

      case 'lights_tpow': 
      {
        // Ack command
        var power = parseInt( commandParts[1] );
        bridge.emitStatus('lights_tpow:' + power );

        setTimeout( function()
        {
          // Move to target position
          bridge.emitStatus('lights_pow:' + power );
        }, 250 );

        break;
      }

      case 'elights_tpow': 
      {
        // Ack command
        var power = parseInt( commandParts[1] );
        bridge.emitStatus('elights_tpow:' + power );

        setTimeout( function()
        {
          // Move to target position
          bridge.emitStatus('elights_pow:' + power );
        }, 250 );

        break;
      }

      case 'camServ_tpos': 
      {
        // Ack command

        var pos = parseInt( commandParts[1] );
        bridge.emitStatus('camServ_tpos:' + pos );

        setTimeout( function()
        {
          // Move to target position
          bridge.emitStatus('camServ_pos:' + pos );
        }, 250 );

        break;
      }

      case 'camServ_inv': 
      {
        // Ack command
        bridge.emitStatus('camServ_inv:' + commandParts[1] );
        break;
      }

      case 'camServ_spd': 
      {
        // Ack command
        var speed = parseInt( commandParts[1] );
        bridge.emitStatus('camServ_spd:' + speed );
        break;
      }

      case 'rcap': 
      {
        bridge.emitStatus('CAPA:255');
        debug('CAPA:255');
        break;
      }
      
      case 'eligt': 
      {
        bridge.emitStatus('LIGPE:' + commandParts[1] / 100);
        debug('External light status: ' + commandParts[1] / 100);
        break;
      }

      case 'escp': 
      {
        bridge.emitStatus('ESCP:' + commandParts[1]);
        debug('ESC status: ' + commandParts[1]);
        break;
      }

      case 'claser': 
      {
        if (bridge.laserEnabled) 
        {
          bridge.laserEnabled = false;
          bridge.emitStatus('claser:0');
          debug('Laser status: 0');
        } 
        else 
        {
          bridge.laserEnabled = true;
          bridge.emitStatus('claser:255');
          debug('Laser status: 255');
        }

        break;
      }

      case 'holdDepth_on': 
      {
        var targetDepth = 0;

        if (!bridge.depthHoldEnabled) 
        {
          targetDepth = currentDepth;
          bridge.depthHoldEnabled = true;
        }

        bridge.emitStatus('targetDepth:' + (bridge.depthHoldEnabled ? targetDepth.toString() : DISABLED));
        debug('Depth hold enabled');
        break;
      }

      case 'holdDepth_off': 
      {
        targetDepth = -500;
        bridge.depthHoldEnabled = false;
        bridge.emitStatus('targetDepth:' + (bridge.depthHoldEnabled ? targetDepth.toString() : DISABLED));
        debug('Depth hold disabled');
        break;
      }

      case 'holdHeading_on': 
      {
        var targetHeading = 0;
        targetHeading = currentHeading;
        bridge.targetHoldEnabled = true;
        bridge.emitStatus('targetHeading:' + (bridge.targetHoldEnabled ? targetHeading.toString() : DISABLED));
        debug('Heading hold enabled');
        break;
      }

      case 'holdHeading_off': 
      {
        var targetHeading = 0;
        targetHeading = -500;
        bridge.targetHoldEnabled = false;
        bridge.emitStatus('targetHeading:' + (bridge.targetHoldEnabled ? targetHeading.toString() : DISABLED));
        debug('Heading hold disabled');
        break;
      }

      // Passthrough tests
      case 'example_to_foo': 
      {
        bridge.emitStatus('example_foo:' + commandParts[1]);
        break;
      }

      case 'example_to_bar': 
      {
        bridge.emitStatus('example_bar:' + commandParts[1]);
        break;
      }

      default: 
      {
        debug('Unsupported command: ' + commandText);
      }
    }

    // Echo this command back to the MCU
    bridge.emitStatus('cmd:' + command);
  };

  bridge.emitStatus = function (status) {
    var txtStatus = reader.parseStatus(status);
    bridge.emit('status', txtStatus);
    if (emitRawSerial) {
      bridge.emit('serial-recieved', status);
    }
  };
  bridge.connect = function () {
    debug('!Serial port opened');
    // Add status interval functions
    bridge.timeInterval = setInterval(bridge.emitTime, 1000);
    bridge.statsInterval = setInterval(bridge.emitStats, 3000);
    bridge.navDataInterval = setInterval(bridge.emitNavData, 100);  // Emit serial port opened event
  };
  bridge.close = function () {
    debug('!Serial port closed');
    // Remove status interval functions
    clearInterval(bridge.timeInterval);
    clearInterval(bridge.statsInterval);
    clearInterval(bridge.navDataInterval);  // Emit serial port closed event
  };
  bridge.startRawSerialData = function startRawSerialData() {
    emitRawSerial = true;
  };
  bridge.stopRawSerialData = function stopRawSerialData() {
    emitRawSerial = false;
  };
  // Set up intervals to emit mocked 
  bridge.emitTime = function () {
    bridge.emit('status', reader.parseStatus('time:' + time));
    time += 1000;
  };
  var BT1I = 0;
  var BT2I = 0;
  var BRDV = 11;
  bridge.emitStats = function () {
    var data = 'iout:0.2;BT.1.I:0.3;BT.2.I:0.5;BNO055.enabled:true;BNO055.test1.pid:passed;BNO055.test2.zzz:passed;';
    var status = reader.parseStatus(data);
    bridge.emit('status', status);
  };
  bridge.emitNavData = function () {
    var result = '';
    // Generate depth
    var rnd = (Math.random() * 20 - 10) / 100;
    currentDepth += currentDepth * rnd;
    currentDepth = Math.min(Math.max(currentDepth, 1), 100);
    result += 'deep:' + currentDepth + ';';
    // Generate heading
    currentHeading += 5;
    result += 'hdgd:' + currentHeading + ';';
    if (currentHeading >= 360) {
      currentHeading = 0;
    }
    // Generate pitch
    currentPitch = 0.01 * (Math.floor(Math.random() * 201) - 100);
    result += 'pitc:' + currentPitch + ';';
    // Generate roll
    currentRoll = 0.03 * (Math.floor(Math.random() * 201) - 100);
    result += 'roll:' + currentRoll + ';';
    // Generate battery tube 1 current
    rnd = (Math.random() * 20 - 10) / 100;
    current += current * rnd;
    current = Math.min(Math.max(current, 1), 10);
    result += 'BT1I:' + current + ';';
    // Generate battery tube 2 current
    rnd = (Math.random() * 20 - 10) / 100;
    current += current * rnd;
    current = Math.min(Math.max(current, 1), 10);
    result += 'BT2I:' + current + ';';
    // Generate board voltage
    rnd = (Math.random() * 20 - 10) / 100;
    BRDV += BRDV * rnd;
    BRDV = Math.min(Math.max(BRDV, 1), 10);
    result += 'BRDV:' + BRDV + ';';
    result += 'vout:' + BRDV + ';';

    // Emit status update
    bridge.emit('status', reader.parseStatus(result));
  };
  // Listen for firmware settings updates
  // TODO: Has this been deprecated for TSET?
  reader.on('firmwareSettingsReported', function (settings) {
    bridge.emit('firmwareSettingsReported', settings);
  });
  return bridge;
}
// Helper class for parsing status messages
var StatusReader = function () {
  var reader = new EventEmitter();
  var currTemp = 20;
  var currDepth = 0;
  var processSettings = function processSettings(parts) {
    var setparts = parts.split(',');
    var settingsCollection = {};
    for (var s = 0; s < setparts.length; s++) {
      var lastParts = setparts[s].split('|');
      settingsCollection[lastParts[0]] = lastParts[1];
    }
    reader.emit('firmwareSettingsReported', settingsCollection);
    return settingsCollection;
  };
  var processItemsInStatus = function processItemsInStatus(status) {
    if ('iout' in status) {
      status.iout = parseFloat(status.iout);
    }
    if ('btti' in status) {
      status.btti = parseFloat(status.btti);
    }
    if ('vout' in status) {
      status.vout = parseFloat(status.vout);
    }
  };
  reader.parseStatus = function parseStatus(rawStatus) {
    var parts = rawStatus.split(';');
    var status = {};
    for (var i = 0; i < parts.length; i++) {
      var subParts = parts[i].split(':');
      switch (subParts[0]) {
      case '*settings':
        status.settings = processSettings(subParts[1]);
        break;
      default:
        status[subParts[0]] = subParts[1];
      }
    }
    processItemsInStatus(status);
    return status;
  };
  return reader;
};
module.exports = Bridge;