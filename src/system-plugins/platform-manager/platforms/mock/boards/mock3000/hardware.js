var EventEmitter = require('events').EventEmitter;
var debug        = require('debug')( 'hardware' );

function Hardware() 
{
  var DISABLED      = 'DISABLED';
  var hardware      = new EventEmitter();
  var reader        = new StatusReader();
  var emitRawSerial = false;

  hardware.depthHoldEnabled   = false;
  hardware.targetHoldEnabled  = false;
  hardware.laserEnabled       = false;

  reader.on('Arduino-settings-reported', function (settings) 
  {
    hardware.emit('Arduino-settings-reported', settings);
  });
  
  hardware.connect = function () 
  {
    debug('!Serial port opened');
  };
  
  hardware.startRawSerialData = function startRawSerialData() 
  {
    emitRawSerial = true;
  };
  
  hardware.stopRawSerialData = function stopRawSerialData() 
  {
    emitRawSerial = false;;
  };

  hardware.write = function (command) 
  {
    var commandParts = command.split(/\(|\)/);
    var commandText = commandParts[0];
    
    if (commandText === 'rcap') 
    {
      hardware.emitStatus('CAPA:255');
    }
    
    if (commandText === 'ligt') 
    {
      hardware.emitStatus('LIGP:' + commandParts[1]/100);
      debug('HARDWARE-MOCK return light status:'+  commandParts[1]/100);
    }
    
    if (commandText === 'eligt') 
    {
      hardware.emitStatus('LIGPE:' + commandParts[1]/100);
      debug('HARDWARE-MOCK return elight status:'+  commandParts[1]/100);
    }
    
    if (commandText === 'escp') 
    {
      hardware.emitStatus('ESCP:' + commandParts[1]);
      debug('HARDWARE-MOCK return ESC status:'+commandParts[1]);
    }
    
    if (commandText === 'tilt') 
    {
      hardware.emitStatus('servo:' + commandParts[1]);
    }
    
    if (commandText === 'claser') 
    {
        if (hardware.laserEnabled) 
        {
          hardware.laserEnabled = false;
          hardware.emitStatus('claser:0');
        }
        else 
        {
          hardware.laserEnabled = true;
          hardware.emitStatus('claser:255');
        }
        
        debug('HARDWARE-MOCK return laser status');
    }

    // Depth hold
    if (commandText === 'holdDepth_on') 
    {
        var targetDepth = 0;
        
        if (!hardware.depthHoldEnabled) 
        {
            targetDepth = currentDepth;
            hardware.depthHoldEnabled = true;
            debug('HARDWARE-MOCK depth hold enabled');
        }
        
        hardware.emitStatus(
          'targetDepth:' +
          (hardware.depthHoldEnabled ? targetDepth.toString() : DISABLED)
        );
    }

    if (commandText === 'holdDepth_off') 
    {
        targetDepth = -500;
        hardware.depthHoldEnabled = false;
        debug('HARDWARE-MOCK depth hold DISABLED');

        hardware.emitStatus(
          'targetDepth:' +
          (hardware.depthHoldEnabled ? targetDepth.toString() : DISABLED)
        );
    }

    // Heading hold
    if (commandText === 'holdHeading_on') 
    {
        var targetHeading = 0;
        targetHeading = currentHeading;
        hardware.targetHoldEnabled= true
        debug('HARDWARE-MOCK heading hold enabled');

        hardware.emitStatus(
          'targetHeading:' + (hardware.targetHoldEnabled ? targetHeading.toString() : DISABLED)
        );
    }

    // Heading hold
    if (commandText === 'holdHeading_off') 
    {
        var targetHeading = 0;
            targetHeading = -500;
            hardware.targetHoldEnabled = false;
            debug('HARDWARE-MOCK heading hold DISABLED');
            
        hardware.emitStatus(
          'targetHeading:' + (hardware.targetHoldEnabled ? targetHeading.toString() : DISABLED)
        );
    }

    // example tests for passthrough
    if (commandText === 'example_to_foo') 
    {
      hardware.emitStatus('example_foo:' + commandParts[1]);
    }
    
    if (commandText === 'example_to_bar') 
    {
      hardware.emitStatus('example_bar:' + commandParts[1]);
    }
    
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
  
  hardware.close = function () 
  {
    debug('!Serial port closed');
  };
  
  var time = 1000;
  
  setInterval(function () 
  {
    hardware.emit('status', reader.parseStatus('time:' + time));
    time += 1000;
  }, 1000);
  
  setInterval(sendEvent, 3000);
  
  function sendEvent() 
  {
    var data = 'vout:9.9;iout:0.2;BT.1.I:0.3;BT.2.I:0.5;BNO055.enabled:true;BNO055.test1.pid:passed;BNO055.test2.zzz:passed;';
    var status = reader.parseStatus(data);
    hardware.emit('status', status);
  }

  var currentDepth = 1;
  var currentHeading = 0;
  var currentServo = 1500;
  var current = 2;

  var interval = setInterval(function() 
  {
    var result = "";
    var rnd = (Math.random() * 20 - 10)/100;
    currentDepth += currentDepth*rnd;
    currentDepth = Math.min(Math.max(currentDepth, 1), 100);
    result+='deep:' + currentDepth + ';'


    currentHeading += 5;
    result+='hdgd:' + currentHeading + ';'
    if (currentHeading >= 360) 
    {
      currentHeading = 0;
    }

    rnd = (Math.random() * 20 - 10)/100;
    current += current*rnd;
    current = Math.min(Math.max(current, 1), 10);
    result+='bt1i:' + current + ';'

    rnd = (Math.random() * 20 - 10)/100;
    current += current*rnd;
    current = Math.min(Math.max(current, 1), 10);
    result+='bt2i:' + current + ';'

    currentServo +=50;
    result+='servo:' + currentServo + ';'
    if (currentServo >= 2000) {
      currentServo = 1000;
    }

    hardware.emit('status', reader.parseStatus(result));
    hardware.write('');

  }, 2000);

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
    
    reader.emit('Arduino-settings-reported', settingsCollection);
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
