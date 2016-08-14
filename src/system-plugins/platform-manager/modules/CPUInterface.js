var util = require('util');
var Interface = require('Interface.js');
var debug = {};
function CPUInterface(deps) {
  // Inherit from Interface module
  Interface.call(this, 'cpu', deps);
  debug = this.debug;
  this.RegisterDefaultAPI();
}
util.inherits(CPUInterface, Interface);
// Useful for creating "required" functions
CPUInterface.prototype.RegisterDefaultAPI = function () {
  this.AddMethod('Initialize', function () {
    debug(this.oName + ' not yet implemented!');
  }, true);
};
module.exports = CPUInterface;