var crc             = require('crc');
var serialPort      = require('serialport');
var EventEmitter    = require('events').EventEmitter;
var StatusReader    = require('StatusReader');
var debug           = require('debug')( 'hardware' );

function Hardware() {
  var self              = this;
  var hardware          = new EventEmitter();
  var reader            = new StatusReader();
  var serialConnected   = false;
  var emitRawSerialData = false;
  
  hardware.serial = {};
  
  reader.on('Arduino-settings-reported', function (settings) {
    hardware.emit('Arduino-settings-reported', settings);
  });
  
  hardware.connect = function () {

    hardware.serial = new serialPort.SerialPort(CONFIG.serial, {
      baudrate: CONFIG.serial_baud,
      parser: serialPort.parsers.readline('\r\n')
    });

    hardware.serial.on('open', function () {
      serialConnected = true;
      debug('Serial port open');
    });

    hardware.serial.on('close', function (data) {
      debug('!Serial port closed');
      serialConnected = false;
    });

    hardware.serial.on('data', function (data) {
      var status = reader.parseStatus(data);
      hardware.emit('status', status);
      if (emitRawSerialData)
        hardware.emit('serial-recieved', data + '\n');
    });

  };


  // This code intentionally spaces out the serial commands so that the buffer does not overflow
  var timesent = new Date();
  hardware.write = function (command) {
    debug( command );
    var crc8 = crc.crc81wire(command);
    var commandBuffer = new Buffer(command,'utf8');
    var crcBuffer = new Buffer(1);
    crcBuffer[0]=crc8;

    var messagebuffer = Buffer.concat([crcBuffer,commandBuffer]);
    if (CONFIG.production && serialConnected) {
      var currenttime = new Date();
      var delay = 3-((currenttime.getTime() - timesent.getTime()));
      if (delay < 0) delay = 0;
      timesent = currenttime;
      timesent.setMilliseconds(timesent.getMilliseconds + delay);
      setTimeout(function(){
        hardware.serial.write(messagebuffer);
        if (emitRawSerialData)  hardware.emit('serial-sent', command);
      }, delay);
    } else {
      debug('DID NOT SEND');
    }
  };
  hardware.startRawSerialData = function startRawSerialData() {
    emitRawSerialData = true;
  };

  hardware.stopRawSerialData = function stopRawSerialData() {
    emitRawSerialData = false;
  };

  hardware.close = function () {
    serialConnected = false;
    //This code is a work around for a race condition in the serial port code https://github.com/voodootikigod/node-serialport/issues/241#issuecomment-43058353
    var sp = hardware.serial;
    hardware.serial.flush(function(err) {
      setTimeout(function() {
        sp.close(function(err) {
        });
      }, 10);
  });

  };
  return hardware;
}
module.exports = Hardware;
