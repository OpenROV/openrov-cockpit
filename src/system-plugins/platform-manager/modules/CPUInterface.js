var util      = require('util');
var Interface = require('Interface.js');
var logger    = require('AppFramework.js').logger;

function CPUInterface(deps) 
{
  // Inherit from Interface module
  Interface.call(this, 'cpu', deps);
  this.RegisterDefaultAPI();
}

util.inherits(CPUInterface, Interface);

// Useful for creating "required" functions
CPUInterface.prototype.RegisterDefaultAPI = function ()
 {
  this.AddMethod('Initialize', function () 
  {
    logger.debug(this.oName + ' not yet implemented!');
  }, true);
};

module.exports = CPUInterface;