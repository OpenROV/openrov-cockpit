var crc = require('crc');
var SerialPort = require('serialport');
var EventEmitter = require('events').EventEmitter;
function Bridge() {
  var self = this;
  var bridge = new EventEmitter();
  var reader = new StatusReader();
  var emitRawSerial = false;
  var serialConnected = false;
  var uartPath = '/dev/ttyAMA0';
  var uartBaud = 1500000;
  var serialPort = {};
  var lastWriteTime = new Date();
 bridge.connect = function () {
    serialPort = new SerialPort(uartPath, {
      baudRate: uartBaud,
      autoOpen: true
    });
    
    var Readline = SerialPort.parsers.Readline;
    var parser =serialPort.pipe(Readline({delimiter: '\r\n'}));    

    serialPort.on('open', function () {
      serialConnected = true;
      console.log('Serial port opened!');
    });
    serialPort.on('error',function(err){
      console.log('Serial error',err)
    })
    serialPort.on('close', function (data) {
      console.log('Serial port closed!');
      serialConnected = false;
    });
    parser.on('data', function (data) {
      var status = reader.parseStatus(data);
      bridge.emit('status', status);
      if (emitRawSerial) {
        bridge.emit('serial-recieved', data + '\n');
      }
    });
  };

  // This code intentionally spaces out the serial commands so that the buffer does not overflow
  bridge.write = function (command) {
    var crc8 = crc.crc81wire(command);
    var commandBuffer = new Buffer(command, 'utf8');
    var crcBuffer = new Buffer(1);
    crcBuffer[0] = crc8;
    var messagebuffer = Buffer.concat([
        crcBuffer,
        commandBuffer
      ]);
    if (serialConnected) {
      var now = new Date();
      var delay = 3 - (now.getTime() - lastWriteTime.getTime());
      if (delay < 0) {
        delay = 0;
      }
      lastWriteTime = now;
      lastWriteTime.setMilliseconds(lastWriteTime.getMilliseconds + delay);
      setTimeout(function () {
        serialPort.write(messagebuffer);
        if (emitRawSerial) {
          bridge.emit('serial-sent', command);
        }
      }, delay);
    } else {
      console.log('DID NOT SEND');
    }
  };
  bridge.startRawSerialData = function startRawSerialData() {
    emitRawSerial = true;
  };
  bridge.stopRawSerialData = function stopRawSerialData() {
    emitRawSerial = false;
  };
  bridge.close = function () {
    serialConnected = false;
    //This code is a work around for a race condition in the serial port code https://github.com/voodootikigod/node-serialport/issues/241#issuecomment-43058353
    var sp = serialPort;
    serialPort.flush(function (err) {
      setTimeout(function () {
        sp.close(function (err) {
        });
      }, 10);
    });
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