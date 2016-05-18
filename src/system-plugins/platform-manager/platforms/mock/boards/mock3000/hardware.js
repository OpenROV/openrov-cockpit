var EventEmitter = require('events').EventEmitter;
var debug        = require('debug')( 'hardware' );

function Hardware() 
{
  var DISABLED      = 'DISABLED';
  var hardware      = new EventEmitter();
  var reader        = new StatusReader();
  var emitRawSerial = false;

  // Initial values
  var time            = 1000;
  var currentDepth    = 1;
  var currentHeading  = 0;
  var currentServo    = 1500;
  var current         = 2;

  hardware.depthHoldEnabled   = false;
  hardware.targetHoldEnabled  = false;
  hardware.laserEnabled       = false;
  
  // -----------------------------------------
  // Methods
 
  hardware.write = function( command ) 
  {
    var commandParts = command.split(/\(|\)/);
    var commandText = commandParts[0];
    
    switch( commandText ) 
    {
      case "rcap":
      {
        hardware.emitStatus('CAPA:255');
        debug( "CAPA:255")
        break;
      }
        
      case "ligt":
      {
        hardware.emitStatus('LIGP:' + commandParts[1]/100);
        debug('Light status: '+  commandParts[1]/100);
        break;
      }
      
      case "eligt":
      {
        hardware.emitStatus('LIGPE:' + commandParts[1]/100);
        debug('External light status: '+  commandParts[1]/100);
        break;
      }
      
      case "escp":
      {
        hardware.emitStatus('ESCP:' + commandParts[1]);
        debug('ESC status: ' + commandParts[1]);
        break;
      }
      
      case "tilt":
      {
        hardware.emitStatus('servo:' + commandParts[1]);
        debug('Tilt status: ' + commandParts[1]/100);
        break;
      }
      
      case "claser":
      {
        if (hardware.laserEnabled) 
        {
          hardware.laserEnabled = false;
          hardware.emitStatus('claser:0');
          debug('Laser status: 0');
        }
        else 
        {
          hardware.laserEnabled = true;
          hardware.emitStatus('claser:255');
          debug('Laser status: 255');
        }
        
        break;
      }
      
      case "holdDepth_on":
      {
        var targetDepth = 0;
        
        if (!hardware.depthHoldEnabled) 
        {
            targetDepth = currentDepth;
            hardware.depthHoldEnabled = true;
        }
        
        hardware.emitStatus('targetDepth:' + (hardware.depthHoldEnabled ? targetDepth.toString() : DISABLED) );
        
        debug('Depth hold enabled');
        
        break;
      }
      
      case "holdDepth_off":
      {
        targetDepth = -500;
        hardware.depthHoldEnabled = false;

        hardware.emitStatus( 'targetDepth:' + (hardware.depthHoldEnabled ? targetDepth.toString() : DISABLED) );
        debug('Depth hold disabled');
        
        break;
      }
      
      case "holdHeading_on":
      {
        var targetHeading = 0;
        targetHeading = currentHeading;
        hardware.targetHoldEnabled= true;

        hardware.emitStatus( 'targetHeading:' + (hardware.targetHoldEnabled ? targetHeading.toString() : DISABLED) );
        debug('Heading hold enabled');
        
        break;
      }
      
      case "holdHeading_off":
      {
        var targetHeading = 0;
            targetHeading = -500;
            hardware.targetHoldEnabled = false;
            
        hardware.emitStatus( 'targetHeading:' + (hardware.targetHoldEnabled ? targetHeading.toString() : DISABLED) );
        debug('Heading hold disabled');
        
        break;
      }
      
      // Passthrough tests
      case "example_to_foo":
      {
        hardware.emitStatus('example_foo:' + commandParts[1]);
        break;
      }
      
      case "example_to_bar":
      {
        hardware.emitStatus('example_bar:' + commandParts[1]);
        break;
      }
      
      default:
      {
        debug( "Unsupported command: " + commandText );
      }
    }
    
    // Echo this command back to the MCU
    hardware.emitStatus('cmd:' + command);
  };
  
  hardware.emitStatus = function(status) 
  {
    var txtStatus = reader.parseStatus(status);
    hardware.emit('status', txtStatus);
    
    if (emitRawSerial) 
    {
      hardware.emit('serial-recieved', status);
    }
  };
  
  hardware.connect = function () 
  {
    debug('!Serial port opened');
    
    // Add status interval functions
    hardware.timeInterval    = setInterval( hardware.emitTime, 1000 );
    hardware.statsInterval   = setInterval( hardware.emitStats, 3000 );
    hardware.navDataInterval = setInterval( hardware.emitNavData, 2000 );
    
    // Emit serial port opened event
  };
  
  hardware.close = function () 
  {
    debug('!Serial port closed');
    
    // Remove status interval functions
    clearInterval( hardware.timeInterval );
    clearInterval( hardware.statsInterval );
    clearInterval( hardware.navDataInterval );
    
    // Emit serial port closed event
  };
  
  hardware.startRawSerialData = function startRawSerialData() 
  {
    emitRawSerial = true;
  };
  
  hardware.stopRawSerialData = function stopRawSerialData() 
  {
    emitRawSerial = false;
  };
  
  // Set up intervals to emit mocked 
  hardware.emitTime = function () 
  {
    hardware.emit('status', reader.parseStatus('time:' + time));
    time += 1000;
  };
  
  hardware.emitStats = function() 
  {
    var data = 'vout:9.9;iout:0.2;BT.1.I:0.3;BT.2.I:0.5;BNO055.enabled:true;BNO055.test1.pid:passed;BNO055.test2.zzz:passed;';
    var status = reader.parseStatus(data);
    hardware.emit('status', status);
  };

  hardware.emitNavData = function() 
  {
    var result = "";
    
    // Generate depth
    var rnd = (Math.random() * 20 - 10)/100;
    currentDepth += currentDepth*rnd;
    currentDepth = Math.min(Math.max(currentDepth, 1), 100);
    result+='deep:' + currentDepth + ';'

    // Generate heading
    currentHeading += 5;
    result+='hdgd:' + currentHeading + ';'
    if (currentHeading >= 360) 
    {
      currentHeading = 0;
    }

    // Generate battery tube 1 current
    rnd = (Math.random() * 20 - 10)/100;
    current += current*rnd;
    current = Math.min(Math.max(current, 1), 10);
    result+='bt1i:' + current + ';'

    // Generate battery tube 2 current
    rnd = (Math.random() * 20 - 10)/100;
    current += current*rnd;
    current = Math.min(Math.max(current, 1), 10);
    result+='bt2i:' + current + ';'

    // Generate servo command
    currentServo +=50;
    result+='servo:' + currentServo + ';'
    if (currentServo >= 2000) {
      currentServo = 1000;
    }

    // Emit status update
    hardware.emit('status', reader.parseStatus(result));
  };
  
  // Listen for firmware settings updates
  // TODO: Has this been deprecated for TSET?
  reader.on('firmwareSettingsReported', function (settings) 
  {
    hardware.emit('firmwareSettingsReported', settings);
  });
  
  return hardware;
}

// Helper class for parsing status messages
var StatusReader = function () 
{
  var reader = new EventEmitter();
  var currTemp = 20;
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
  }

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
  }

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

module.exports = Hardware;
