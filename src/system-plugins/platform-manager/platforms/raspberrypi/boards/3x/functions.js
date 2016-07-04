var EventEmitter = require('events').EventEmitter;
var fs = require('fs');
var path = require('path');
var spawn = require('child_process').spawn;

var functions = function( board )
{
	board.initialize = function()
	{
		// Use wiring pi to toggle the pin to pull the MCU out of reset
	};
	
	board.buildSketch = function( sketchName )
	{		
		var hardwarePath = "--hardware-path=\"/opt/openrov/arduino/hardware\"";
		var toolsPath = "--toolchain-path=\"/opt/openrov/arduino/hardware/tools\"";
		var samdLibPath = "--samdlib-path=\"/opt/openrov/arduino/hardware/openrov/samd/libraries\"";
		var sharedLibPath = "--sharedlib-path=\"/opt/openrov/firmware/libraries\"";
		var fqbn = "--fqbn=\"openrov:samd:trident_alpha\""
		var productId = "--board-product-id=" + board.info.productId;
		var sketch = "--sketchname=" + sketchName;
		
		var cmd = "../../scripts/build.sh";
		var args = [ hardwarePath, toolsPath, samdLibPath, sharedLibPath, fqbn, productId, sketch ];
		var process = spawn(cmd, args);
		
		board.emit('buildSketch.status', 'started' );
		
		process.on('exit', function (code) 
		{
			if( code !== 0 ) 
			{
				console.log('---- Error detected in firmware build process ----');
				board.emit('buildSketch.result', 'fail' );
			}
			else
			{
				board.emit( 'buildSketch.result', 'success' );
				console.log( "Build success" );
			}
		});
		
		process.stderr.on('data', function (data) 
		{
			console.log(data.toString());
		} );
		
		process.stdout.on('data', function (data)
		{
			console.log(data.toString());
		});
	};
	
	board.uploadSketch = function( sketchName )
	{
		var productId = "--board-product-id=" + board.info.productId;
		var sketch = "--sketchname=" + sketchName;
		
		var cmd = "../../scripts/upload.sh";
		var args = [ productId, sketch ];
		var process = spawn(cmd, args);
		
		process.on('exit', function (code) 
		{
			if( code !== 0 ) 
			{
				console.log('---- Error detected in firmware upload process ----');
				board.emit('uploadSketch.result', 'fail' );
			}
			else
			{
				board.emit( 'uploadSketch.result', 'success' );
				console.log( "Upload success" );
			}
		});
		
		process.stderr.on('data', function (data) 
		{
			console.log(data.toString());
		} );
		
		process.stdout.on('data', function (data)
		{
			console.log(data.toString());
		});
	};
	
	board.resetMCU = function()
	{
		var pinArg = "--pin=" + board.pinmap.UC_RESETN.gpio;

		var cmd = "../../scripts/resetMCU.sh";
		var args = [ pinArg ];
		var process = spawn(cmd, args);
		
		process.on('exit', function (code) 
		{
			if( code !== 0 ) 
			{
				console.log('---- Error detected in MCU reset process ----');
				board.emit('mcuReset.result', 'fail' );
			}
			else
			{
				board.emit( 'mcuReset.result', 'success' );
				console.log( "Reset success" );
			}
		});
		
		process.stderr.on('data', function (data) 
		{
			console.log(data.toString());
		} );
		
		process.stdout.on('data', function (data)
		{
			console.log(data.toString());
		});
	};
}

module.exports = functions;
