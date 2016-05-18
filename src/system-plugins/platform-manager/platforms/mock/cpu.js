var Q 			= require( "q" );
var fs 			= require( "fs" );
var path		= require( "path" );
var getFuncs 	= require( "./functions.js" );

var EventEmitter = require("events").EventEmitter;

var readFile = Q.denodeify( fs.readFile );

var loadCpuConfig = function( platform )
{
	// Create the CPU object
	var cpu = platform.cpuInterface;
	cpu.info = {};
	
	// Compose the CPU interface object
	return lookupCpuDetails( cpu )
			.then( checkSupport )
			.then( loadFunctions )
			.then( function( cpu )
			{
				// All steps were successful, so we can add the cpu interface to the platform
				platform.cpu = cpu;
				
				return platform;
			} );
};

var lookupCpuDetails = function( cpu )
{
	return Q.fcall( function()
			{
				if( process.env.CPU_MOCK !== undefined )
				{
					return {
						Revision: "123MOCK",
						Serial: "1234567890"
					}
				}
				else
				{
					console.log( "No mock cpu defined" );
					throw "No mock cpu defined";
				}
			} )
			.then( function( details )
			{
				// Add revision and serial details to the interface object
				cpu.info.revision 	= details.Revision;
				cpu.info.serial 	= details.Serial;
				
				return cpu;
			} )
			.catch( function( error )
			{
				console.log( error );
			} );
}

var checkSupport = function( cpu )
{
	return readFile( path.resolve( __dirname, "config/cpuInfo.json" ) )
			.then( JSON.parse )
			.then( function( json )
			{
				// Lookup cpu details in the raspi json file, based on revision
				var details = json[ cpu.info.revision ];
				
				if( details !== undefined )
				{	
					// Board is supported. Add the retrieved details to the interface object
					for( var prop in details )
					{
						cpu.info[ prop ] = details[ prop ];
					}
			
					return cpu;
				}
				else
				{
					throw new Error( "Board doesn't exist in database." );
				}
			} );
};

var loadFunctions = function( cpu )
{
	// Add supported CPU functions to the interface
	getFuncs( cpu );
	
	return cpu;
}

module.exports = loadCpuConfig;
