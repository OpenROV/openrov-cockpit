// To eliminate hard coding paths for require, we are modifying the NODE_PATH to include our lib folder
var oldpath = '';
if(process.env['NODE_PATH']!==undefined)
{
    oldpath = process.env['NODE_PATH'];
}

// Just in case already been set, leave it alone
process.env['NODE_PATH'] = ( __dirname + '/modules:' + __dirname + '/platforms:' + oldpath );
require('module').Module._initPaths();

var fs 				= require( "fs" );
var path 			= require( "path" );

var MCUInterface 	= require( "MCUInterface.js" );
var CPUInterface 	= require( "CPUInterface.js" );

var PlatformManager = function( name, deps )
{	
	var self = this;
	this.platform = {};
	
	this.platform.mcu = new MCUInterface( deps );
	this.platform.cpu = new CPUInterface( deps );

	// Load interfaces
	LoadCPUInterface( self.platform )
	.then( LoadBoardInterface )
	.then( function( platform )
	{
		console.log( "Successfully loaded configuration for a supported platform." );
		deps.globalEventLoop.emit( "platform.supported" );
	})
	.catch( function( error )
	{
		deps.globalEventLoop.emit( "platform.unsupported", error );
		throw new Error( "Failed to load platform details for this system: " + error );
	} );
}

function LoadCPUInterface( platform )
{ 
	if( process.env.PLATFORM == "" )
	{
		throw "No platform specified!";
	}
	
	var Loader = require( "./platforms/" + process.env.PLATFORM + "/cpu.js" );
	
	// Call loader
	return Loader( platform );
};

function LoadBoardInterface( platform )
{ 
	var Loader = require( "./platforms/" + process.env.PLATFORM + "/board.js" );
	
	// Call loader
	return Loader( platform );
};

// Export provides the public interface
module.exports = function (name, deps) 
{
	return new PlatformManager(name,deps);
};




