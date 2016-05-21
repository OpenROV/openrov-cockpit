var os = require('os-utils'), EventEmitter = require('events').EventEmitter;
var CPUUsage = 10;
var StatusReader = function () {
  var reader = new EventEmitter();
  var currTemp = 20;
  var currDepth = 0;
  var currCpuUsage = 0;
  setInterval(function () {
    os.cpuUsage(function (v) {
      currCpuUsage = v;
    });
  }, 1000);

  var processSettings = function processSettings(parts){
    var setparts = parts.split(',');
    var settingsCollection = {};
    for (var s = 0; s < setparts.length; s++) {
      var lastParts = setparts[s].split('|');
      settingsCollection[lastParts[0]] = lastParts[1];
    }
    reader.emit('Arduino-settings-reported', settingsCollection);
    return settingsCollection;
  }

  var processItemsInStatus = function processItemsInStatus(status){
    if ('iout' in status) {
      status.iout = parseFloat(status.iout);
    }
    if ('btti' in status) {
      status.btti = parseFloat(status.btti);
    }
    if ('vout' in status) {
      status.vout = parseFloat(status.vout);
      status.cpuUsage = currCpuUsage;
    }
  }

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
module.exports = StatusReader;
