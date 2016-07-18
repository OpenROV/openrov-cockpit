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

function PlatformManager( name, deps )
{	
	var self = this;

	var platformName = "";

	this.platform = {};
	this.platform.systemDirectory = deps.config.systemDirectory;
	
	this.platform.board = new BoardInterface( deps );
	this.platform.cpu 	= new CPUInterface( deps );

	console.log( "PLATFORM: Loading platform interfaces..." );

	Promise.try( function()
	{
		// Load interfaces
		return Promise.try( function()
		{
			return LoadPlatformName( self.platform );
		} )
		.then( LoadCPUInterface )
		.then( LoadBoardInterface )
		.then( function( platform )
		{
			console.log( "PLATFORM: Successfully loaded configuration for a supported platform." );
			deps.globalEventLoop.emit( "platform.supported" );
		})
		.catch( function( error )
		{
			//deps.globalEventLoop.emit( "platform.unsupported", error );
			console.error( "PLATFORM: Failed to load platform details for this system: " + error );
			throw new Error( "Failed to load platform details for this system: " + error );
		} );
	} )
	.catch(  function( error )
	{
		console.error( "What: " + JSON.stringify( err ) );
	} );
}

function LoadPlatformName( platform )
{ 
	if( process.env.PLATFORM !== undefined )
	{
		// Allow shortcut
		platform.name = process.env.PLATFORM;
		console.log( "PLATFORM: Platform shortcut set to: " + platform.name );

		return platform;
	}
	else
	{
		var platConfPath = path.resolve( platform.systemDirectory + "/config/platform.conf" );
		
		return fs.readFileAsync( platConfPath, 'utf8' )
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
			throw new Error( "Failed to load platform name: " );
		} );
	}
};

function LoadCPUInterface( platform )
{ 
	console.log( "PLATFORM: Loading CPU interface..." );
	
	var CPUInterfaceLoader = require( "./platforms/" + platform.name + "/cpu.js" );
	
	return CPUInterfaceLoader.Compose( platform )
			.catch( function( err )
			{
				console.log( "Failed to load CPU interface: " + err.message );
				throw err;
			})
			.then( function()
			{
				return platform;
			})
};

function LoadBoardInterface( platform )
{ 
	console.log( "PLATFORM: Loading Board interface..." );

	var BoardInterfaceLoader = require( "./platforms/" + platform.name + "/board.js" );
	
	return BoardInterfaceLoader.Compose( platform )
			.catch( function( err )
			{
				console.log( "Failed to load board interface: " + err.message );
				
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




