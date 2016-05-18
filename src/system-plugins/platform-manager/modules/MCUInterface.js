var util 		= require( 'util' );
var Interface 	= require( 'Interface.js' );
var debug		= require('debug')( 'MCUInterface' );

function MCUInterface( deps ) 
{
	// Inherit from Interface module
	Interface.call( this, "mcu", deps );	

	this.RegisterDefaultAPI();
};
util.inherits( MCUInterface, Interface );

// Useful for creating "required" functions
MCUInterface.prototype.RegisterDefaultAPI = function()
{
	this.AddMethod( "Initialize", function()
	{
		console.log( this.oName + " not yet implemented!" );
	}, true );
	
	this.AddMethod( "SendCommand", function( command )
	{
		console.log( this.oName + " not yet implemented!" );
	}, true );
	
	this.AddMethod( "SendMotorTest", function( port, starboard, vertical )
	{
		console.log( this.oName + " not yet implemented!" );
	}, true );
};

module.exports = MCUInterface;
