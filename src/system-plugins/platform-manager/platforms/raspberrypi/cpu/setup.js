var fs = require('fs');
var path = require('path');
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
  }, false);
};
module.exports = SetupCPUInterface;