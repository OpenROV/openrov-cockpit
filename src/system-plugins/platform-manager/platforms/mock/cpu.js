var Promise = require('bluebird');
var readFileAsync = Promise.promisify(require('fs').readFile);
var path = require('path');
var CPUInterface = function () {
  var self = this;
};
CPUInterface.prototype.Compose = function (platform) {
  // Temporary container used for cpu detection and info loading
  var cpu = { targetCPU: platform.cpu };
  var self = this;
  // Compose the CPU interface object
  return self.LoadInfo(cpu).then(self.CheckSupport).then(self.LoadInterfaceImplementation);
};
CPUInterface.prototype.LoadInfo = function (cpu) {
  return Promise.try(function () {
    cpu.info = {
      revision: '123MOCK',
      serial: '1234567890'
    };
    return cpu;
  });
};
CPUInterface.prototype.CheckSupport = function (cpu) {
  return readFileAsync(path.resolve(__dirname, 'cpu/revisionInfo.json')).then(JSON.parse).then(function (json) {
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
  // Load and apply the interface implementation to the actual CPU interface
  require('./cpu/setup.js')(cpu.targetCPU);
  return cpu;
};
module.exports = new CPUInterface();