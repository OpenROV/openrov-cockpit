// To eliminate hard coding paths for require, we are modifying the NODE_PATH to include our lib folder
var oldpath = '';
if(process.env['NODE_PATH']!==undefined)
{
    oldpath = process.env['NODE_PATH'];
}

// Just in case already been set, leave it alone
process.env['NODE_PATH'] = ( __dirname + '/modules:' + __dirname + '/platforms:' + oldpath );
require('module').Module._initPaths();

var path 			= require( "path" );
var Promise			= require( "bluebird" );
var fs				= Promise.promisifyAll( require( "fs" ) );

var BoardInterface 	= require( "BoardInterface.js" );
var CPUInterface 	= require( "CPUInterface.js" );

var PlatformManager = function( name, deps )
{	
	var self = this;

	this.platform = {};
	this.platform.systemDirectory = deps.config.systemDirectory;
	
	this.platform.board = new BoardInterface( deps );
	this.platform.cpu 	= new CPUInterface( deps );

	// Load interfaces
	Promise.try( function()
	{
		return LoadPlatformName( self.platform );
	} )
	.then( LoadCPUInterface )
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

function LoadPlatformName( platform )
{ 
	if( process.env.PLATFORM !== undefined )
	{
		// Allow shortcut
		platform.name = process.env.PLATFORM;
		return platform;
	}
	else
	{
		var platConfPath = path.resolve( platform.systemDirectory + "/config/platform.conf" );
		
		return fs.readFileAsync( platConfPath, "utf8" )
		.then( function( data )
		{
			// Parse platform info from configuration file
			var platInfo 	= JSON.parse( data );
			platform.name 	= platInfo.platform;
			
			return platform;
		} )
		.catch( function( err ) 
		{
			// Can't proceed if we can't determine the platform
			throw "Failed to load platform name: " + JSON.stringify( err );
		})
	}
};

function LoadCPUInterface( platform )
{ 
	var CPUInterfaceLoader = require( "./platforms/" + platform.name + "/cpu.js" );
	
	return CPUInterfaceLoader.Compose( platform )
			.catch( function( err )
			{
				throw "Failed to load CPU interface: " + JSON.stringify( err );
			})
			.then( function()
			{
				return platform;
			})
};

function LoadBoardInterface( platform )
{ 
	var BoardInterfaceLoader = require( "./platforms/" + platform.name + "/board.js" );
	
	return BoardInterfaceLoader.Compose( platform )
			.catch( function( err )
			{
				console.error( "Failed to load board interface: " + JSON.stringify( err ) );
				
				// Continue anyway. Board is optional to operation of cockpit
			} )
			.then( function()
			{
				return platform;
			});
};

// Export provides the public interface
module.exports = function (name, deps) 
{
	return new PlatformManager(name,deps);
};




