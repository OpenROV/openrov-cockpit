var Promise = require('bluebird');
var readFileAsync = Promise.promisify(require('fs').readFile);
var execFileAsync = require('child-process-promise').execFile;
var path = require('path');
var CPUInterface = function () {
  var self = this;
};
CPUInterface.prototype.Compose = function (platform) {
  console.log('CPU: Composing RPI cpu interface...');
  // Temporary container used for cpu detection and info loading
  var cpu = { targetCPU: platform.cpu };
  var self = this;
  // Compose the CPU interface object
  return self.LoadInfo(cpu).then(self.CheckSupport).then(self.LoadInterfaceImplementation);
};
CPUInterface.prototype.LoadInfo = function (cpu) {
  console.log('CPU: Loading RPI cpu info...');
  return GetCpuInfo().then(function (info) {
    // Add revision and serial details to the interface object
    cpu.info = {
      revision: info.Revision,
      serial: info.Serial
    };
    console.log('CPU Info: ' + JSON.stringify(cpu.info));
    return cpu;
  });
};
CPUInterface.prototype.CheckSupport = function (cpu) {
  return readFileAsync(path.resolve(__dirname, 'cpu/revisionInfo.json')).then(JSON.parse).then(function (json) {
    console.log('CPU: Checking details against revision file...');
    // Lookup cpu details in the raspi json file, based on revision
    var details = json[cpu.info.revision];
    if (details !== undefined) {
      // Board is supported. Add the retrieved details to the interface object
      for (var prop in details) {
        cpu.info[prop] = details[prop];
      }
      // Add the info to the target CPU Interface
      cpu.targetCPU.info = cpu.info;
      return cpu;
    } else {
      throw new Error('Board doesn\'t exist in database.');
    }
  });
};
CPUInterface.prototype.LoadInterfaceImplementation = function (cpu) {
  console.log('CPU: Loading RPI CPU interface implementation');
  // Load and apply the interface implementation to the actual CPU interface
  require('./cpu/setup.js')(cpu.targetCPU);
  return cpu;
};
// Helper function to parse /proc/cpuinfo
function GetCpuInfo() {
  return execFileAsync('cat', ['/proc/cpuinfo']).then(function (data) {
    var result = {};
    // Loop through each line in the output
    data.stdout.toString().split('\n').forEach(function (line) {
      // Remove tabs from line
      line = line.replace(/\t/g, '');
      // Split into field:value parts
      var parts = line.split(':');
      // If there are two parts, it has valid data
      if (parts.length === 2) {
        // Replace spaces with underscore
        var fieldName = parts[0].replace(/\s/g, '_');
        var value = parts[1].trim();
        result[fieldName] = value;
      }
    });
    return result;
  });
}
module.exports = new CPUInterface();