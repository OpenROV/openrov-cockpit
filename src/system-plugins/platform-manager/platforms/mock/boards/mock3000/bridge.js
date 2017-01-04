var EventEmitter = require('events').EventEmitter;
var logger = require('AppFramework.js').logger;
var debug = logger.debug.bind(logger);
var trace = logger.trace.bind(logger);

// -----------------------------------------
// Encoding helper functions
function encode( floatIn )
{
    return parseInt( floatIn * 1000 );
}

function decode( intIn )
{
    return ( intIn * 0.001 );
}

function mapTo(value, in_min, in_max, out_min, out_max) 
{
  return (value - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
};

function Bridge() 
{
  var DISABLED      = 'DISABLED';
  var bridge        = new EventEmitter();
  var reader        = new StatusReader();
  var emitRawSerial = false;

  // Controllerboard State
  var cb = 
  {
    time:         0,
    timeDelta_ms: 1000,

    brdvRampUp:   true,
    brdv:         5.0,
    vout:         5.0,
    iout:         2.0,
    bt1i:         0.0,
    bt2i:         0.0
  }

  // IMU State
  var imu = 
  {
    time:         0,
    timeDelta_ms: 10,

    mode:         0,    // 0: GYRO, 1:MAG
    roll:         0,
    rollOffset:   0,
    pitch:        0,
    pitchOffset:  0,
    yaw:          0,
    yawOffset:    0,
    heading:      0
  }

  // Depth sensor state
  var depthSensor =
  {
    time:         0,
    timeDelta_ms: 50,

    waterType:    0,  // 0: Fresh, 1: Salt
    depth:        0,
    depthOffset:  0,
    temperature:  0,
    pressure:     0
  }

  bridge.depthHoldEnabled   = false;
  bridge.targetHoldEnabled  = false;
  bridge.laserEnabled       = false;

  // -----------------------------------------
  // Bridge Methods
  bridge.write = function( command ) 
  {
    var commandParts  = command.split(/\(|\)/);
    var commandText   = commandParts[0];
    var parameters    = commandParts[ 1 ].split( ',' );

    // Simulate the receipt of the above command
    switch (commandText) 
    {
      case 'version': 
      {
        bridge.emitStatus('ver:<<{{10024121ae3fa7fc60a5945be1e155520fb929dd}}>>');
        debug('ver:<<{{10024121ae3fa7fc60a5945be1e155520fb929dd}}>>');
        
        break;
      }

      case 'wake': 
      {
        bridge.emitStatus('awake:;');
        
        break;
      }

      case 'ex_hello': 
      {
        var helloGoodbye = parseInt( parameters[0] );

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

      case 'imu_mode':
      {
         imu.mode = parseInt( parameters[0] );
         bridge.emitStatus(`imu_mode:${imu.mode};`);

         break;
      }

      case 'imu_level':
      {
          // Echo back requested settings
          imu.rollOffset = decode( parseInt( parameters[0] ) );
          bridge.emitStatus("imu_roff:" + encode( imu.rollOffset ) + ";" );

          imu.pitchOffset = decode( parseInt( parameters[1] ) );
          bridge.emitStatus("imu_poff:" + encode( imu.pitchOffset ) + ";" );

          break;
      }

      case 'imu_zyaw':
      {
          // Set the current heading as the offset
          imu.yawOffset = imu.yaw;
          bridge.emitStatus(`imu_zyaw:ack;`);

          break;
      }

      case 'depth_zero':
      {
          // Set the current depth as the offset
          depthSensor.depthOffset = depthSensor.depth;
          bridge.emitStatus(`depth_zero:ack;`);

          break;
      }

      case 'depth_clroff':
      {
          // Set the depth offset to 0
          depthSensor.depthOffset = 0;
          bridge.emitStatus(`depth_clroff:ack;`);

          break;
      }

      case 'depth_water':
      {
          depthSensor.waterType = parseInt( parameters[0] );
          bridge.emitStatus(`depth_water:${depthSensor.waterType};`);

          break;
      }

      case 'ping': 
      {
        bridge.emitStatus(`pong:${parameters[0]}`);
        trace(`pong:${parameters[0]}`);
        break;
      }      

      case 'lights_tpow': 
      {
        // Ack command
        var power = parseInt( parameters[0] );
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
        var power = parseInt( parameters[0] );
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

        var pos = parseInt( parameters[0] );
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
        bridge.emitStatus('camServ_inv:' + parameters[0] );
        break;
      }

      case 'camServ_spd': 
      {
        // Ack command
        var speed = parseInt( parameters[0] );
        bridge.emitStatus('camServ_spd:' + speed );
        break;
      }
      
      case 'eligt': 
      {
        bridge.emitStatus('LIGPE:' + parameters[0] / 100);
        debug('External light status: ' + parameters[0] / 100);
        break;
      }

      case 'escp': 
      {
        bridge.emitStatus('ESCP:' + parameters[0]);
        debug('ESC status: ' + parameters[0]);
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
        targetHeading = headingOut;
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
        bridge.emitStatus('example_foo:' + parameters[0]);
        break;
      }

      case 'example_to_bar': 
      {
        bridge.emitStatus('example_bar:' + parameters[0]);
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

  bridge.emitStatus = function (status) 
  {
    var txtStatus = reader.parseStatus(status);
    bridge.emit('status', txtStatus);

    if (emitRawSerial) 
    {
      bridge.emit('serial-recieved', status);
    }
  };

  bridge.startRawSerialData = function startRawSerialData() 
  {
    emitRawSerial = true;
  };

  bridge.stopRawSerialData = function stopRawSerialData() 
  {
    emitRawSerial = false;
  };

  bridge.connect = function () 
  {
    debug('!Serial port opened');

    // Add status interval functions
    bridge.imuInterval    = setInterval( bridge.updateIMU,          imu.timeDelta_ms );
    bridge.depthInterval  = setInterval( bridge.updateDepthSensor,  depthSensor.timeDelta_ms );
    bridge.cbInterval     = setInterval( bridge.updateCB,           cb.timeDelta_ms );
  };

  bridge.close = function () 
  {
    debug('!Serial port closed');

    // Remove status interval functions
    clearInterval( bridge.imuInterval );
    clearInterval( bridge.depthInterval );
    clearInterval( bridge.cbInterval );
  };

  function normalizeAngle360( a )
  {
    return ((a > 360.0) ? (a - 360.0) : ((a < 0.0) ? (a + 360.0) : a));
  } 

  function normalizeAngle180( a ) 
  {
    return ((a > 180.0) ? (a - 360.0) : ((a < -180.0) ? (a + 360.0) : a));
  };

  bridge.updateIMU = function()
  {
    // Update time
    imu.time += imu.timeDelta_ms;

    // Generate pitch -90:90 degrees
    imu.pitch = 90 * Math.sin( imu.time * ( Math.PI / 10000 ) );
    
    // Generate roll -90:90 degrees
    imu.roll = 90 * Math.sin( imu.time * ( Math.PI / 30000 ) );
    
    // Generate yaw between -120:120 degrees
    var baseYaw = 120 * Math.sin( imu.time * ( Math.PI / 10000 ) );

    // Handle mode switches (gyro mode is -180:180, mag mode is 0:360)
    if( imu.mode === 0 )
    {
      imu.yaw = baseYaw;
    }
    else if( imu.mode === 1 )
    {
      imu.yaw = normalizeAngle360( baseYaw );
    }

    // Create result string
    var result = "";
    result += 'imu_p:' + encode( imu.pitch - imu.pitchOffset ) + ';';
    result += 'imu_r:' + encode( imu.roll - imu.rollOffset )+ ';';

    // Handle imu mode for yaw/heading
    if( imu.mode === 0 )
    {
      // GYRO mode
      result += 'imu_y:' + encode( normalizeAngle180( imu.yaw - imu.yawOffset ) ) + ';';
    }
    else if( imu.mode === 1 )
    {
      // MAG mode
      result += 'imu_y:' + encode( imu.yaw ) + ';';
    }

    // Emit status update
    bridge.emit( 'status', reader.parseStatus( result ) );
  }

  bridge.updateDepthSensor = function()
  {
    // Update time
    depthSensor.time += depthSensor.timeDelta_ms;

    // Generate depth from -10:10 meters
    depthSensor.depth = 10 * Math.sin( depthSensor.time * ( Math.PI / 20000 ) );

    // Generate temperature from 15:25 degrees
    depthSensor.temperature = 20 + ( 5 * Math.sin( depthSensor.time * ( Math.PI / 40000 ) ) );

    // Generate pressure from 50:70 kPa
    depthSensor.pressure = 60 + ( 10 * Math.sin( depthSensor.time * ( Math.PI / 40000 ) ) );

    // Create result string (Note: we don't bother to take into account water type or offsets w.r.t. temperature or pressure )
    var result = "";
    result += 'depth_d:' + encode( depthSensor.depth - depthSensor.depthOffset ) + ';';
    result += 'depth_t:' + encode( depthSensor.temperature ) + ';';
    result += 'depth_p:' + encode( depthSensor.pressure ) + ';';

    // Emit status update
    bridge.emit( 'status', reader.parseStatus( result ) );
  }

  bridge.updateCB = function()
  {
    // Update time
    cb.time += cb.timeDelta_ms;

    // Generate a current baseline from 1:2 amps
    var currentBase = ( ( Math.random() * 1 ) + 1 );

    // Generate currents for each battery tube from the base current, deviation of +/- 0.2A
    cb.bt1i = currentBase + ( ( Math.random() * 0.4 ) - 0.2 );
    cb.bt2i = currentBase + ( ( Math.random() * 0.4 ) - 0.2 );

    // Get total current by adding the two tube currents
    cb.iout = cb.bt1i + cb.bt2i;

    // Generate board voltage (ramps up and down between 5V and 12V)
    if( cb.brdvRampUp )
    {
      cb.brdv += 0.5;
      if( cb.brdv >= 12 )
      {
        cb.brdvRampUp = false;
      }
    }
    else
    {
      cb.brdv -= 0.5;
      if( cb.brdv <= 5 )
      {
        cb.brdvRampUp = true;
      }
    }

    cb.vout = cb.brdv;

    // Create result string
    var result = "";
    result += 'BT2I:' + cb.bt2i + ';';
    result += 'BT1I:' + cb.bt1i + ';';
    result += 'BRDV:' + cb.brdv + ';';
    result += 'vout:' + cb.vout + ';';
    result += 'iout:' + cb.iout + ';';
    result += 'time:' + cb.time + ';';

    // Emit status update
    bridge.emit( 'status', reader.parseStatus( result ) );
  }

  // Listen for firmware settings updates
  // TODO: Has this been deprecated for TSET?
  reader.on('firmwareSettingsReported', function (settings) 
  {
    bridge.emit('firmwareSettingsReported', settings);
  });

  return bridge;
}

// Helper class for parsing status messages
var StatusReader = function() 
{
  var reader    = new EventEmitter();
  var currTemp  = 20;
  var currDepth = 0;

  var processSettings = function processSettings(parts) 
  {
    var setparts = parts.split(',');
    var settingsCollection = {};

    for (var s = 0; s < setparts.length; s++) 
    {
      var lastParts = setparts[s].split('|');
      settingsCollection[lastParts[0]] = lastParts[1];
    }

    reader.emit('firmwareSettingsReported', settingsCollection);
    return settingsCollection;
  };

  var processItemsInStatus = function processItemsInStatus(status) 
  {
    if ('iout' in status) 
    {
      status.iout = parseFloat(status.iout);
    }

    if ('btti' in status) 
    {
      status.btti = parseFloat(status.btti);
    }

    if ('vout' in status) 
    {
      status.vout = parseFloat(status.vout);
    }
  };

  reader.parseStatus = function parseStatus(rawStatus) 
  {
    var parts = rawStatus.split(';');
    var status = {};

    for (var i = 0; i < parts.length; i++) 
    {
      var subParts = parts[i].split(':');

      switch (subParts[0]) 
      {
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