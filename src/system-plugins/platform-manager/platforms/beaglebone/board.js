var Q 		= require("q");
var fs 		= require("fs");
var path	= require('path');
var Parser 	= require("binary-parser").Parser;

var fopen		= Q.denodeify( fs.open );
var read 		= Q.denodeify( fs.read );
var readFile	= Q.denodeify( fs.readFile );

var ComposeInterface = function( platform )
{
	return LoadBoardInfo( platform.mcu )
			.then( LoadPinMap )
			.then( LoadInterface )
			.then( function( board )
			{
				// Success
				return platform;
			} )	
			.catch( function( err )
			{
				console.log( "Err loading board info: " + err );
				
				// Fail, but return anyway
				return platform;
			} );
};

var LoadBoardInfo = function( board ) 
{
	return Q.fcall( function()
			{
				// Check SPI communication. If good, we're happy!
				
				board.info = 
				{
					productId: 0,
					serial: 0
				};
				
			} );
			
			// TODO: Check eeprom as well. If it exists, we are a 2.8 specifically
}

var LoadPinMap = function( board )
{
	return readFile( path.resolve(__dirname, "boards/" + board.info.productId + "/pinmap.json" ) )
			.then( JSON.parse )
			.then( function( json )
			{
				var pinmap = json[ board.info.rev ];
				
				if( pinmap !== undefined )
				{
					board.pinmap = pinmap;
					return board;
				}
			} );
}

var LoadInterface = function( board )
{
	// Load functions for the board interface
	require( "./boards/" + board.info.productId + "/setup.js" )( board );
	
	return board;
};

module.exports = ComposeInterface;