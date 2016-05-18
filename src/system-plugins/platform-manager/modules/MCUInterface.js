var util 		= require( 'util' );
var Interface 	= require( 'Interface.js' );
var debug		= require('debug')( 'MCUInterface' );

function MCUInterface( deps ) 
{
	// Inherit from Interface module
	Interface.call( this );	

	this.RegisterDefaultAPI();
};

util.inherits( MCUInterface, Interface );

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
	
	this.AddMethod( "SendMotorTest", function( port, vertical, starboard )
	{
		console.log( this.oName + " not yet implemented!" );
	}, true );
};

module.exports = MCUInterface;
