var registerFunctions = function( cpu )
{
	cpu.initialize = function()
	{
		// Do any initialization routines here
	};
	
	cpu.setGovernor = function( governorName )
	{ 
		// Set the governor here
		console.log( "Set Governor to: " + governorName );
	};
}

module.exports = registerFunctions;