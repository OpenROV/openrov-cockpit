var fs 				= require('fs');
var path 			= require('path');
var spawn 			= require('child_process').spawn;

var SetupCPUInterface = function( cpu )
{
	var debug = cpu.debug;
	
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
}


// ------------------------------------------------
// Public API Definitions	
// ------------------------------------------------
var RegisterFunctions = function( cpu )
{
	cpu.AddMethod( "Initialize", function()
	{
		console.log( "Initializing cpu!" );
	}, false );
	
	cpu.AddMethod( "SetGovernor", function( governorName )
	{
		console.log( "Setting governor!" );
	}, false );
	
	cpu.AddMethod( "BuildFirmware", function( firmwarePath, buildConfig )
	{
		console.log( "Building firmware: " + firmwarePath );
		console.log( "Build config: " + buildConfig );
	}, false );
}

module.exports = SetupCPUInterface;