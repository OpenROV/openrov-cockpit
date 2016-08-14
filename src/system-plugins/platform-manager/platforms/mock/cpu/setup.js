var fs = require('fs');
var path = require('path');
var spawn = require('child_process').spawn;
var debug = {};
var SetupCPUInterface = function (cpu) {
  debug = cpu.debug;
  // Decorate the CPU interface with cpu specific properties
  cpu.stats = {};
  // ------------------------------------------------
  // Setup private cpu methods
  cpu.GetCPUStats = function () {
  };
  // ------------------------------------------------
  // Setup cpu interface event handlers
  setInterval(function () {
  }, 1000);
  // ------------------------------------------------
  // Setup Public API	
  RegisterFunctions(cpu);
  // Call initialization routine
  cpu.global.emit('cpu.Initialize');
};
// ------------------------------------------------
// Public API Definitions	
// ------------------------------------------------
var RegisterFunctions = function (cpu) {
  cpu.AddMethod('Initialize', function () {
    debug('Initializing cpu!');
  }, false);
  cpu.AddMethod('SetGovernor', function (governorName) {
    debug('Setting governor!');
  }, false);
  cpu.AddMethod('BuildFirmware', function (firmwarePath, buildConfig) {
    debug('Building firmware: ' + firmwarePath);
    debug('Build config: ' + buildConfig);
    cpu.global.emit('cpu.firmwareBuildStatus', 'building');
    setTimeout(function () {
      cpu.global.emit('cpu.firmwareBuildStatus', 'success');
    }, 3000);
  }, false);
};
module.exports = SetupCPUInterface;