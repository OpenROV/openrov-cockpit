// Test With:
// DEBUG="app:*" node App.js -p 8300 -c "data.pem" -k "key.pem"

// To eliminate hard coding paths for require, we are modifying the NODE_PATH to include our lib folder
var nodepath =  __dirname + "/:" + 
                __dirname + "/lib/:" + 
                "/home/spiderkeys/workspace/openrov-cockpit/src/lib/:" +
                ( ( process.env[ "NODE_PATH" ] !== undefined ) ? process.env[ "NODE_PATH" ] : "" );

process.env["NODE_PATH"] = nodepath;

require( "module" ).Module._initPaths();

// Logging utilities
const log           = require( "debug" )( "app:log" );
const error		    = require( "debug" )( "app:error" );

// Parse command line arguments
var argv = require( "yargs" )
    .usage( "Usage: $0 -p [port number] -c [certificate path] -k [key path]" )
    .number( "p" )
    .string( "c" )
    .string( "k" )
    .boolean( "m" )
    .boolean( "h" )
    .demand( [ "p", "c", "k" ] )
    .fail( function (msg, err) 
    {
        error( "Error parsing arguments: " + msg );
        error( "Exiting..." );
        process.exit( 1 );
    })
    .argv;

try
{	
    var settings =
    {
        port:           argv.p,                                         // Supervisor socket.io port number
        cert:           argv.c,                                         // Absolute SSL Cert Path
        key:            argv.k,                                         // Absolute SSL Key Path
        useMock:        ( ( argv.m !== undefined ) ? argv.m : false ),  // Use mock mode
        useHardware:    ( ( argv.h !== undefined ) ? argv.h : false )   // Use real hardware (true) or mock hardware (false)
    }

    // Create supervisor
    const Supervisor    = require( "Supervisor" );
    const supervisor    = new Supervisor( settings );

    // Run supervisor
    supervisor.run();
}
catch( err )
{
	error( "Error running supervisor: " + err );
	error( "Exiting..." );

	process.exit( 2 );
}