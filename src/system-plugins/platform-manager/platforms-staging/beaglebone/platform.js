var Q 		= require("q");
var fs 		= require("fs");
var path	= require('path');

var fopen		= Q.denodeify( fs.open );
var read 		= Q.denodeify( fs.read );
var readFile	= Q.denodeify( fs.readFile );

var getBoardInfo = function( platform )
{
        return searchForEEPROMPath()
			.then( readEEPROM )
			.then( parseSerialAndID )
			.then( findBoardDetails )
			.then( function( details )
			{
				return platform;
			} );
};

var searchForEEPROMPath = function()
{
	return Q.any([ openFile( "/sys/bus/nvmem/devices/at24-0/nvmem" ),
					openFile( "/sys/class/nvmem/at24-0/nvmem" ),
					openFile( "/sys/bus/i2c/devices/0-0050/eeprom" ) ] );
}
 
var openFile = function( filename )
{
	return fopen( filename, 'r' );
};

var readEEPROM = function( fd )
{
	return read( fd, new Buffer(244), 0, 244, 0 )
		.then(function (result) {
				return result[1];
			});
};

var parseSerialAndID = function( data )
{
	var id = data.slice( 0, 16 );
	var serial = data.slice( 16, 28 );

	return new Q( { "id": id, "serial": serial } );
};

var findBoardDetails = function( eepromInfo )
{
	return readFile( path.resolve(__dirname, 'config/beaglebone-info.json' ) )
			.then( JSON.parse )
			.then( function( json )
			{
				var hexId = eepromInfo.id.toString( 'hex' );
				var details = json[ hexId ];
				
				if( details !== undefined )
				{
					details.serial = eepromInfo.serial.toString();
					return details;
				}
				else
				{
					throw new Error("Board doesn't exist in database.");
				}
			} );
};

module.exports = getBoardInfo;
