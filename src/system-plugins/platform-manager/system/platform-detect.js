#!/usr/bin/env node

var Promise = require( "bluebird" );
var fs     	= Promise.promisifyAll( require("fs") );
var path	= require('path');

fs.readFileAsync( "/etc/systemd/system/orov-cockpit.service.d/platform.conf", "utf8" )
.then( function( data )
{
	// Parse platform name
	var platform = data.split("\"")[ 1 ].split( "=" )[1];
	
	var cwd = process.cwd();
	
	var boardDetectScript = require( path.resolve( "./src/system-plugins/platform-manager/platforms/" + platform + "/board-detect.js" ) );
} )
.catch( function( err )
{
	console.log( "Error: " + JSON.stringify( err ) );
	process.exit( 1 );
})
.then( function()
{
	process.exit( 0 );
})
