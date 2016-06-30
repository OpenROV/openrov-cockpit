var path 			= require( "path" );
var Promise			= require( "bluebird" );
var fs				= Promise.promisifyAll( require( "fs-extra" ) );
var spawnAsync 		= require('child-process-promise').spawn;

var ArduinoBuilder 	= function(){};

ArduinoBuilder.prototype.BuildSketch = function( sketchPath, dest, options, onStdout, onStderr, onErr )
{
	// Handle options
	
	var opt =
	{
		"fqbn": 	"openrov:samd:trident_alpha",
		"hardware": "/opt/openrov/arduino/hardware",
		"tools":	"/opt/openrov/arduino/hardware/tools",
		"libs":
		[
			"/opt/openrov/arduino/hardware/openrov/samd/libraries",
			"/opt/openrov/firmware/libraries"
		],
		"preproc":
		[
			"MCU=SAMD21",
			"BOARD=TRIDENT"
		]
	};
	
	// Create promise
	var promise 		= spawn( 'arduino-builder', ['hello'] );
	var childProcess 	= promise.childProcess;

	// Attach listeners
	childProcess.stdout.on( 'data', onStdout );
	childProcess.stderr.on( 'data', onStderr );

	return promise;
}