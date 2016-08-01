var CONFIG = require('../../lib/config');
var logger = require('../../lib/logger').create(CONFIG);

var PlatformManager = function(name,deps) 
{
	'use strict';
	var self = this;

	logger.log( 'Loaded nodejs Platform Manager component' );
	return self;
};

module.exports = function(name,deps)
{
  	return new PlatformManager(name,deps);
}
