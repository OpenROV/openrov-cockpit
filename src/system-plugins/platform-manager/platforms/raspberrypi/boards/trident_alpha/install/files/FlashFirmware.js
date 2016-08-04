var path                        = require( "path" );
var Promise                     = require( "bluebird" );
var fs                          = Promise.promisifyAll( require( "fs-extra" ) );
var execFileAsync               = require('child-process-promise').execFile;

var command = "program /opt/openrov/firmware/bin/trident/Trident.bin; reset; exit"; 

var args = 
[
        "-f",
        "/opt/openrov/system/etc/openocd.cfg",
        "-c",
        command
];

console.log( "Flashing MCU firmware..." );

// Create promise
var promise             = execFileAsync( 'openocd', args );
var childProcess        = promise.childProcess;

// Attach listeners
childProcess.stdout.on( 'data', function( stdout ){ console.log( stdout.toString( 'utf8' ) ); } );
childProcess.stderr.on( 'data', function( stderr ){ console.error( stderr.toString( 'utf8' ) ); } );

promise
.then( function()
{
        console.log( "Success!" );
})
