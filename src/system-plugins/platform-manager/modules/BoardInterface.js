var util      = require('util');
var Interface = require('Interface.js');
var logger    = require('AppFramework.js').logger;

function BoardInterface(deps) 
{
  // Inherit from Interface module
  Interface.call(this, 'mcu', deps);
  this.RegisterDefaultAPI();
}

util.inherits(BoardInterface, Interface);

// Useful for creating "required" functions
BoardInterface.prototype.RegisterDefaultAPI = function() 
{
  this.AddMethod('Initialize', function () 
  {
    logger.debug(this.oName + ' not yet implemented!');
  }, true);
};

module.exports = BoardInterface;