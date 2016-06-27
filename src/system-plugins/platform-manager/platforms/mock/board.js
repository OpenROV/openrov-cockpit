var Promise = require( "bluebird" );
var fs 		= Promise.promisifyAll( require("fs") );
var path	= require('path');

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
	if( process.env.BOARD == "" )
	{
		throw "No board specified!";
	}
	
	return fs.readFileAsync( path.resolve(__dirname, "boards/" + process.env.BOARD + "/eepromMock.json" ) )
			.then( JSON.parse )
			.then( function( info )
			{
				board.info = info;
				return board;
			} );
}

var LoadPinMap = function( board )
{
	return fs.readFileAsync( path.resolve( __dirname, "boards/" + board.info.productId + "/pinmap.json" ) )
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
	require( "./boards/" + board.info.productId + "/setup.js" )( board );
	return board;
};

module.exports = ComposeInterface;