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
		
			// Send the platform object to the hardware interface
			globalEmitter.emit( "physicalInterface.platform", platform );
		},
		function ( error ) 
		{	
			console.error( "Failed to verify that the platform is supported." );
			
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




