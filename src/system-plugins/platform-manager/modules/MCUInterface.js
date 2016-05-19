var util 		= require( 'util' );
var Interface 	= require( 'Interface.js' );
var debug		= {};

function MCUInterface( deps ) 
{
	// Inherit from Interface module
	Interface.call( this, "mcu", deps );
	
	debug = this.debug;

	this.RegisterDefaultAPI();
};
util.inherits( MCUInterface, Interface );

// Useful for creating "required" functions
MCUInterface.prototype.RegisterDefaultAPI = function()
{
	this.AddMethod( "Initialize", function()
	{
		debug( this.oName + " not yet implemented!" );
	}, true );
	
	this.AddMethod( "SendCommand", function( command )
	{
		debug( this.oName + " not yet implemented!" );
	}, true );
	
	this.AddMethod( "SendMotorTest", function( port, starboard, vertical )
	{
		debug( this.oName + " not yet implemented!" );
	}, true );
};

module.exports = MCUInterface;
