var util      = require('util');
var Interface = require('Interface.js');
var debug     = {};

function BoardInterface(deps) 
{
  // Inherit from Interface module
  Interface.call(this, 'mcu', deps);
  debug = this.debug;
  this.RegisterDefaultAPI();
}

util.inherits(BoardInterface, Interface);

// Useful for creating "required" functions
BoardInterface.prototype.RegisterDefaultAPI = function() 
{
  this.AddMethod('Initialize', function () 
  {
    debug(this.oName + ' not yet implemented!');
  }, true);
};

module.exports = BoardInterface;