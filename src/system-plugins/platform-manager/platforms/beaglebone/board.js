var Promise = require( "bluebird" );
var fs 		= Promise.promisifyAll( require("fs") );
var path	= require('path');

var BoardInterface = function()
{
	
};

BoardInterface.prototype.Compose = function( platform )
{	
	// Temporary container used for cpu detection and info loading
	var board =
	{
		targetBoard: platform.board
	};
	
	var self = this;
	
	return self.LoadInfo( board )
			.then( self.LoadPinMap )
			.then( self.LoadInterface );
};

BoardInterface.prototype.LoadInfo = function( board ) 
{
	board.info = {};
	
	return fs.readFileAsync( path.resolve( "/opt/openrov/system/etc/2xBoardInfo.json" ) )
			.then( JSON.parse )
			.then( function( info )
			{
				board.info = info;
				return board;
			} );
}

BoardInterface.prototype.LoadPinMap = function( board )
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

BoardInterface.prototype.LoadInterface = function( board )
{
	require( "./boards/" + board.info.productId + "/setup.js" )( board.targetBoard );
	return board;
};

module.exports = new BoardInterface();