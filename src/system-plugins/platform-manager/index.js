// To eliminate hard coding paths for require, we are modifying the NODE_PATH to include our lib folder
var oldpath = '';
if(process.env['NODE_PATH']!==undefined)
{
    oldpath = process.env['NODE_PATH'];
}

// Just in case already been set, leave it alone
process.env['NODE_PATH'] = ( __dirname + '/modules:' + __dirname + '/platforms:' + oldpath );
require('module').Module._initPaths();

var fs 		= require( "fs" );
var path 	= require( "path" );
var Q 		= require( "q" );

var MCUInterface = require( "MCUInterface.js" );
var CPUInterface = require( "CPUInterface.js" );

var PlatformManager = function( name, deps )
{	
	var self = this;
	this.platform = {};
	
	this.platform.mcuInterface = new MCUInterface( deps );
	this.platform.cpuInterface = new CPUInterface( deps );
	
	// Get a list of all supported platforms
	var platformNames = getDirectories( path.join( __dirname, "platforms" ) );
	
	// Function for loading a platform based on its name
	var loadPlatform = function ( platformName )
	{ 
		var platformPath = "./platforms/" + platformName;
		
		// Attempt to create platform, passing it the deps object
		return require( platformPath + "/platform.js" )( self.platform );
	};
	
	// Attempt to load the platform configuration for each supported CPU
	var promises = platformNames.map( loadPlatform );
	
	// If a supported platform was detected and its configuration loaded, we are now ready to create it's interface in the system
	Q.any( promises )
	.then( 
		function( platform ) 
		{
			console.log( "Successfully loaded configuration for a supported platform." );
		},
		function ( error ) 
		{	
			throw new Error( "Failed to load platform details for this system: " + error );
		}
	)
	.catch( function( error )
	{
		console.log( error );
	} );
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




