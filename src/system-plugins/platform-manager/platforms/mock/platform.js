var Q 				= require("q");
var fs 				= require("fs");
var path			= require("path");
var EventEmitter 	= require("events").EventEmitter;

var loadCpuConfig	= require( "./cpu.js" );
var loadBoardConfig	= require( "./board.js" );

var createPlatform = function()
{
	var platform = {};
	
	return loadCpuConfig( platform )	// This will detect the CPU and is required
			.then( loadBoardConfig );		// This will detect the attached controller board and check to see if it is supported for this CPU
};

module.exports = createPlatform;
