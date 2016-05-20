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
	var board = platform.mcu;
	
	return getBoardInfo( board )
			.then( loadPinMap )
			.then( loadHardwareInterface )
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

var loadHardwareInterface = function( board )
{
	// Load functions for the board interface
	require( "./boards/" + board.info.productId + "/setup.js" )( board );
	
	return board;
};

module.exports = loadBoardConfig;