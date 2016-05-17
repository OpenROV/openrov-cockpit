var oldpath = '';
if( process.env['NODE_PATH'] !== undefined )
{
	oldpath = process.env['NODE_PATH'];
}

// Append this directory to the node path
process.env['NODE_PATH']=__dirname+':'+oldpath;
require('module').Module._initPaths();
console.log("Set NODE_PATH to: "+process.env['NODE_PATH'] );

var fs 		= require( "fs" );
var path 	= require( "path" );
var Q 		= require( "q" );

var PlatformManager = function( name, deps )
{
	var globalEmitter 	= deps.globalEventLoop;
	var cockpitEmitter 	= deps.cockpit;
	var platformNames 	= getDirectories( path.join( __dirname, "platforms" ) );
	
	var manager = {};
	
	var loadPlatform = function ( platformName )
	{ 
		var platformPath = "./platforms/" + platformName;
		
		return require( platformPath + "/platform.js" )( globalEmitter );
	};
	
	// Attempt to load the platform configuration for each supported CPU.
	var promises = platformNames.map( loadPlatform );
	
	// If a supported platform was detected and its configuration loaded, we are now ready to create it's interface in the system
	Q.any( promises )
	.then( 
		function( platform ) 
		{
			console.log( "Successfully loaded configuration for a supported platform." );
			console.log( "CPU Revision: " + platform.cpu.info.revision );
			console.log( "CPU Serial: " + platform.cpu.info.serial );
			console.log( "Board ID: " + platform.board.info.productId )
			
			// Set interface properties
			manager.cpu 	= platform.cpu;
			manager.board 	= platform.board;
			
			// Call initialization routines for each interface
			manager.cpu.initialize();
			manager.board.initialize();
			
			// Global events - CPU
			globalEmitter.on( "platformManager.cpu.setGovernor", function( governorName )
			{
				manager.cpu.setGovernor( governorName );
			} );
			
			// Global events - Board
			globalEmitter.on( "platform.board.buildFirmware", function()
			{
				manager.board.buildSketch( "OpenROV" );
			} );
			
			globalEmitter.on( "platform.board.uploadFirmware", function()
			{
				manager.board.buildSketch( "OpenROV" );
			} );
			
			globalEmitter.on( "platform.board.buildSketch", function( sketchName )
			{
				manager.board.buildSketch( sketchName );
			} );
			
			globalEmitter.on( "platform.board.uploadSketch", function( sketchName )
			{
				manager.board.uploadSketch( sketchName );
			} );
			
			globalEmitter.on( "platform.board.resetMCU", function()
			{
				manager.board.resetMCU();
			} );
			
			// CPU Interface events
			manager.cpuInterface.on( "setGovernor.result", function( data )
			{
				cockpitEmitter.emit( "platform.cpu.setGovernor.result", data );
			});
			
			// Board Interface events
			manager.boardInterface.on( "buildSketch.status", function( data )
			{
				cockpitEmitter.emit( "platform.board.buildSketch.status", data );
			});
			
			manager.boardInterface.on( "buildSketch.output", function( data )
			{
				cockpitEmitter.emit( "platform.board.buildSketch.output", data );
			});
			
			manager.boardInterface.on( "buildSketch.result", function( data )
			{
				cockpitEmitter.emit( "platform.board.buildSketch.result", data );
			});
			
			manager.boardInterface.on( "uploadSketch.result", function( data )
			{
				cockpitEmitter.emit( "platform.board.uploadSketch.result", data );
			});
		
		},
		function ( error ) 
		{	
			throw new Error( "Failed to load platform details for this system: " + error );
		}
	);
}

function getDirectories( srcpath ) 
{
  return fs.readdirSync( srcpath ).filter( function( file ) {
    return fs.statSync( path.join( srcpath, file ) ).isDirectory();
  });
};


// Export provides the public interface
module.exports = function (name, deps) 
{
	return new PlatformManager(name,deps);
};




