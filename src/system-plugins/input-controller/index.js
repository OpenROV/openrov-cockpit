var CONFIG = require('../../lib/config');

function InputController(name, deps) 
{
  'use strict';
  var self = this;
  
  deps.logger.info('Loaded nodejs InputController component');
  return self;
}

module.exports = function (name, deps) {
  return new InputController(name, deps);
};