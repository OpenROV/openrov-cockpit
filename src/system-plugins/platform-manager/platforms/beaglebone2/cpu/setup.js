var fs 				= require('fs');
var path 			= require('path');
var spawn 			= require('child_process').spawn;
var debug			= {};


var SetupCPUInterface = function( cpu )
{
	debug = cpu.debug;
	
	// Decorate the CPU interface with cpu specific properties
	cpu.stats = 
	{
		// chip temp
		// governor
		// core loads
		// ram usage
		// network stats
		// etc
	};
	
	// ------------------------------------------------
	// Setup private cpu methods
	
	cpu.GetCPUStats = function()
	{
		
	}

	// ------------------------------------------------
	// Setup cpu interface event handlers
	
	setInterval(function () 
	{
		// Emit cpu stat updates
	}, 1000 );

	// ------------------------------------------------
	// Setup Public API	
	RegisterFunctions( cpu );
	
	// Call initialization routine
	cpu.global.emit( "cpu.Initialize" );
}


// ------------------------------------------------
// Public API Definitions	
// ------------------------------------------------
var RegisterFunctions = function( cpu )
{
	cpu.AddMethod( "Initialize", function()
	{
	}, false );
	
	cpu.AddMethod( "SetGovernor", function( governorName )
	{

	}, false );
	
	cpu.AddMethod( "BuildFirmware", function( firmwarePath, buildConfig )
	{

	}, false );
}

module.exports = SetupCPUInterface;