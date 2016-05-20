var Q 			= require( "q" );
var fs 			= require( "fs" );
var path		= require( "path" );

var readFile 	= Q.denodeify( fs.readFile );

var ComposeInterface = function( platform )
{
	// Compose the CPU interface object
	return LookupCpuInfo( platform.cpu )
			.then( CheckSupport )
			.then( LoadInterfaceImplementation )
			.then( function( cpu )
			{
				// Success
				return platform;
			} );
};

var LookupCpuInfo = function( cpu )
{
	cpu.info = {};
	
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

var CheckSupport = function( cpu )
{
	return readFile( path.resolve( __dirname, "cpu/revisionInfo.json" ) )
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

var LoadInterfaceImplementation = function( cpu )
{
	require( "./cpu/setup.js" )( cpu );	
	return cpu;
};

module.exports = ComposeInterface;
