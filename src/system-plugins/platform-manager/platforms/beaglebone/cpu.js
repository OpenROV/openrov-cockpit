var Promise			= require( "bluebird" );
var fs				= Promise.promisifyAll( require( "fs" ) );
var path			= require( "path" );

var CPUInterface = function()
{
	var self = this;
};

CPUInterface.prototype.Compose = function( platform )
{
	console.log( "CPU: Composing BBB cpu interface..." );

	// Temporary container used for cpu detection and info loading
	var cpu =
	{
		targetCPU: platform.cpu
	};
	
	var self = this;
	
	// Compose the CPU interface object
	return  self.LoadInfo( cpu )
			.then( self.CheckSupport )
			.then( self.LoadInterfaceImplementation );
};

CPUInterface.prototype.LoadInfo = function( cpu )
{
	console.log( "CPU: Loading BBB cpu info..." );

	return FindBeagleboneEEPROM()
			.then( ReadEEPROM )
			.then( ParseInfo )
			.then( function( info )
			{
				// Add revision and serial details to the interface object
				cpu.info = 
				{
					revision: 	info.revision,
					serial:		info.serial
				}

				console.log( "CPU Info: " + JSON.stringify( cpu.info ) );

				return cpu;
			} );
			
	// Helper functions		
	function FindBeagleboneEEPROM()
	{
		console.log( "CPU: Looking for BBB eeprom..." );

		return Promise.any([ fs.openAsync( "/sys/bus/nvmem/devices/at24-0/nvmem" ),
						fs.openAsync( "/sys/class/nvmem/at24-0/nvmem" ),
						fs.openAsync( "/sys/bus/i2c/devices/0-0050/eeprom" ) ] );
	}
	
	function ReadEEPROM( fd )
	{
		console.log( "CPU: Opening bbb eeprom..." );

		return fs.readAsync( fd, new Buffer(244), 0, 244, 0 )
				.then( function (result) 
				{
					console.log( "CPU: Got bbb eeprom data" );
					return result[1];
				});
	};

	function ParseInfo( data )
	{
		console.log( "CPU: parsing BBB eeprom.." );

		return Promise.try( function()
		{
			var revision = data.slice( 0, 16 );
			var serial = data.slice( 16, 28 );

			console.log( "CPU: Parsed BBB eeprom." );

			return { "revision": revision, "serial": serial };
		} );
	};
}

CPUInterface.prototype.CheckSupport = function( cpu )
{
	console.log( "CPU: Checking BBB support..." );

	return fs.readFileAsync( path.resolve( __dirname, "cpu/revisionInfo.json" ) )
			.then( JSON.parse )
			.then( function( json )
			{
				console.log( "CPU: Checking details against revision file..." );

				// Lookup cpu details in the json file, based on revision
				var details = json[ cpu.info.revision ];
				
				if( details !== undefined )
				{	
					// Board is supported. Add the retrieved details to the interface object
					for( var prop in details )
					{
						cpu.info[ prop ] = details[ prop ];
					}
					
					// Add the info to the target CPU Interface
					cpu.targetCPU.info = cpu.info;
			
					return cpu;
				}
				else
				{
					throw new Error( "Detected CPU was not in list of supported models." );
				}
			} );
};

CPUInterface.prototype.LoadInterfaceImplementation = function( cpu )
{
	console.log( "CPU: Loading CPU interface implementation" );

	// Load and apply the interface implementation to the actual CPU interface
	require( "./cpu/setup.js" )( cpu.targetCPU );		

	console.log( "CPU: Loaded CPU interface implementation" );
	return cpu;
};

module.exports = new CPUInterface();
