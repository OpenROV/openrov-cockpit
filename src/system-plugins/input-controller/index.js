var CONFIG = require('../../lib/config');
var logger = require('../../lib/logger').create(CONFIG);
function InputController(name, deps) {
  'use strict';
  var self = this;
  logger.log('Loaded nodejs InputController component');
  return self;
}
module.exports = function (name, deps) {
  return new InputController(name, deps);
};