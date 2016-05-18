var fs = require('fs');
var path = require('path');
var spawn = require('child_process').spawn;

var RegisterFunctions = function( board )
{
	board.AddMethod( "Initialize", function()
	{
		console.log( "Board initialized!" );
	}, false );
	
	board.AddMethod( "SendCommand", function( command )
	{
		console.log( "Board command: " + command );
	}, false );
	
	board.AddMethod( "SendMotorTest", function( port, vertical, starboard )
	{
		console.log( "Board motor test: " + port + ", " + vertical + ", " + starboard );
	}, false );
}

module.exports = RegisterFunctions;
