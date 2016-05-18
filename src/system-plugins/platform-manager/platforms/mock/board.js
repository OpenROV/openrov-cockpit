var Q 		= require("q");
var fs 		= require("fs");
var path	= require('path');
var Parser 	= require("binary-parser").Parser;

var EventEmitter = require("events").EventEmitter;

var fopen		= Q.denodeify( fs.open );
var read 		= Q.denodeify( fs.read );
var readFile	= Q.denodeify( fs.readFile );

// Define a parser for the board information stored on the controller board's eeprom
var eepromParser = Parser.start()
					.endianess( "little" )
					.uint32( "length" )
					.string( "data",
					{
						encoding: "utf8",
        				length: "length"
					} );

var loadBoardConfig = function( platform )
{
	// Create the CPU object
	var board = platform.mcuInterface;
	
	return getBoardInfo( board )
			.then( loadPinMap )
			.then( loadBoardFunctions )
			.then( function( cpu )
			{
				// All steps were successful
				return platform;
			} )	
			.catch( function( err )
			{
				console.log( "Err loading board info: " + err );
				
				// Return the platform anyway.
				return platform;
			} );
};

var getBoardInfo = function( board ) 
{
	return readFile( path.resolve(__dirname, "config/eepromMock.bin" ) )
			.then( function( data )
			{
				return eepromParser.parse( data ).data;
			} )
			.then( JSON.parse )
			.then( function( info )
			{
				board.info = info;
				return board;
			} );
}

var loadPinMap = function( board )
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

var loadBoardFunctions = function( board )
{
	// Load functions for the board interface
	require( "./boards/" + board.info.productId + "/functions.js" )( board );
	
	return board;
};

module.exports = loadBoardConfig;