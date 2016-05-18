var util 		= require( 'util' );
var Interface 	= require( 'Interface.js' );
var debug		= require('debug')( 'CPUInterface' );

function CPUInterface( deps ) 
{
	// Inherit from Interface module
	Interface.call( this, "cpu", deps );	

	this.RegisterDefaultAPI();
};
util.inherits( CPUInterface, Interface );

// Useful for creating "required" functions
CPUInterface.prototype.RegisterDefaultAPI = function()
{
	this.AddMethod( "Initialize", function()
	{
		console.log( this.oName + " not yet implemented!" );
	}, true );
	
	this.AddMethod( "SetGovernor", function( governorName )
	{
		console.log( this.oName + " not yet implemented!" );
	}, true );
};


module.exports = CPUInterface;


