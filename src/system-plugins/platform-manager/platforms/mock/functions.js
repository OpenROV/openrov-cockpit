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
}

module.exports = RegisterFunctions;