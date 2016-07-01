var fs 				= require('fs');
var path 			= require('path');
var spawn 			= require('child_process').spawn;
var ArduinoHelper	= require('ArduinoHelper');
var Hardware		= require('./bridge.js');

var debug 			= {};

var SetupBoardInterface = function( board )
{
	debug = board.debug;
	
	// Decorate the MCU interface with board specific properties
	board.physics            = new ArduinoHelper().physics;
    board.bridge           = new Hardware();
     
    board.firmwareVersion    = 0;
    board.Capabilities       = 0;
    board.statusdata         = {};
    
    board.settingsCollection = 
    {
        smoothingIncriment: 0,
        deadZone_min: 0,
        deadZone_max: 0,
        water_type: 0 // FreshWater
    };

    board.rovsys = 
    { 
        capabilities: 0 
    };
	
	// ------------------------------------------------
	// Setup private board methods
	
	board.notSafeToControl = function () 
	{
		// Arduino is OK to accept commands. After the Capabilities was added, all future updates require
		// being backward safe compatible (meaning you cannot send a command that does something unexpected but
		// instead it should do nothing).
		if( board.Capabilities !== 0 )
		{
			return false;
		}

		return true;
	};

	board.requestCapabilities = function () 
	{
		var command = 'rcap();';
		board.bridge.write( command );
	};

	board.requestSettings = function () 
	{
		//todo: Move to a settings manager
		var command = 'reportSetting();';
		board.bridge.write( command );
		
		command = 'rmtrmod();';
		board.bridge.write( command );
	};

	// TODO: Move the water setting to diveprofile
	board.updateSetting = function () 
	{
		function watertypeToflag(type)
		{
			if(type=='fresh')
			{
				return 0;
			}

			return 1;
		}

		// This is the multiplier used to make the motor act linear fashion.
		// For example: the props generate twice the thrust in the positive direction than the negative direction.
		// To make it linear we have to multiply the negative direction * 2.
		var command = 'updateSetting('
			+ board.vehicleConfig.preferences.get('smoothingIncriment') + ','
			+ board.vehicleConfig.preferences.get('deadzone_neg') + ','
			+ board.vehicleConfig.preferences.get('deadzone_pos') + ','
			+ watertypeToflag( board.vehicleConfig.preferences.get('plugin:diveprofile:water-type')) + ');';
		
		board.bridge.write(command);
	};

	// ------------------------------------------------
	// Setup bridge interface event handlers
	
	board.bridge.on( 'serial-recieved', function( data ) 
	{
		board.global.emit( board.interface + '.serialRecieved', data );
	});

	board.bridge.on( 'status', function (status) 
	{
		// Clear old status data
		board.statusdata = {};

		// Copy new status data 
		for( var i in status ) 
		{
			board.statusdata[i] = status[i];
		}

		// Re-emit status data for other subsystems
		board.global.emit( board.interface + '.status', board.statusdata );

		// Firmware version
		if( 'ver' in status ) 
		{
			board.firmwareVersion = status.ver;
		}
		
		// Settings update   
		if( 'TSET' in status ) 
		{
			var setparts = status.settings.split(',');
			
			board.settingsCollection.smoothingIncriment    = setparts[0];
			board.settingsCollection.deadZone_min          = setparts[1];
			board.settingsCollection.deadZone_max          = setparts[2];
			board.settingsCollection.water_type            = setparts[3];
			
			board.global.emit( board.interface + '.firmwareSettingsReported', board.settingsCollection );
		}

		// Capability report
		if( 'CAPA' in status ) 
		{
			var s                   = board.rovsys;
			s.capabilities          = parseInt(status.CAPA);
			
			board.Capabilities = s.capabilities;
			board.global.emit( board.interface + '.rovsys', s );
		}

		// Command request
		if( 'cmd' in status ) 
		{
			// Re-emit all commands except ping
			if( status.com != 'ping(0)' )
			{
				board.global.emit( board.interface + '.command', status.cmd );
			}
		}

		// Log entry
		if( 'log' in status )
		{
		}

		// Initial boot notification
		if( 'boot' in status )
		{
			board.Capabilities = 0;
			board.updateSetting();
			board.requestSettings();
			board.requestCapabilities();
		}
	});    
		
	// ------------------------------------------------
	// Setup Public API	
	RegisterFunctions( board );
	
	// Call initialization routine
	board.global.emit( "mcu.Initialize" );
}


// ------------------------------------------------
// Public API Definitions	
// ------------------------------------------------
var RegisterFunctions = function( board )
{
	board.AddMethod( "Initialize", function()
	{
		debug( "MCU Interface initialized!" );
		
		board.global.emit( "mcu.StartSerial" );
	}, false );
	
	board.AddMethod( "FlashFirmware", function( file )
	{
		debug( "Flashing firmware: " + file );
		
		board.bridge.close();
		board.global.emit( "mcu.firmwareFlashStatus", "flashing" );
		
		setTimeout( function()
		{
			board.global.emit( "mcu.firmwareFlashStatus", "success" );
			board.bridge.connect();
		}, 3000 );
	}, false );
	
	board.AddMethod( "DumpFirmware", function( path )
	{
		debug( "Dumping firmware to: " + path );
		
		board.bridge.close();
		board.global.emit( "mcu.firmwareDumpStatus", "dumping" );
		
		setTimeout( function()
		{
			board.global.emit( "mcu.firmwareDumpStatus", "success" );
			board.bridge.connect();
		}, 3000 );
	}, false );
	
	board.AddMethod( "ResetMCU", function( path )
	{
		debug( "Resetting MCU: " + path );
		
		board.bridge.close();
		
		setTimeout( function()
		{
			board.bridge.connect();
		}, 1000 );
	}, false );
	
	board.AddMethod( "FlashESC", function()
	{
		debug( "Flashing ESCs" );
		
		board.bridge.close();
		board.global.emit( "mcu.escFlashStatus", "flashing" );
		
		setTimeout( function()
		{
			board.global.emit( "mcu.escFlashStatus", "success" );
			board.bridge.connect();
		}, 3000 );
	}, false );
	
	board.AddMethod( "SendCommand", function( command )
	{
		if( board.notSafeToControl() )
		{
			return;
		}

		board.bridge.write( command + ";" );
		
	}, false );
	
	board.AddMethod( "SendMotorTest", function( port, starboard, vertical )
	{
		// The 1 bypasses motor smoothing
		var command = 'go(' + board.physics.mapRawMotor(port) + ',' +
			board.physics.mapRawMotor(vertical) + ',' +
			board.physics.mapRawMotor(starboard) + ',1)';
		
		board.bridge.write( command + ";" );
		
	}, false );
	
	board.AddMethod( "RegisterPassthrough", function( config )
	{
		if(config) 
		{
			if(!config.messagePrefix) 
			{
				throw new Error('You need to specify a messagePrefix that is used to emit and receive message.');
			}

			var messagePrefix = config.messagePrefix;

			// Route specific status messages from the firmware to plugins interested in them
			if(config.fromROV) 
			{
				if(Array.isArray(config.fromROV)) 
				{
					config.fromROV.forEach(function(item) 
					{
						board.global.on( board.interface + '.status', function (data) 
						{
							if(item in data) 
							{
								board.cockpit.emit( messagePrefix + '.' + item, data[item] );
							}
						});
					});
				}
				else 
				{ 
					throw new Error('config.fromROV needs to be an array.'); 
				}
			}

			// Route commands to the bridge
			if( config.toROV ) 
			{
				if( Array.isArray( config.toROV ) ) 
				{
					config.toROV.forEach( function(item) 
					{
						board.cockpit.on( messagePrefix + '.' + item, function(data) 
						{
							var args = Array.isArray(data) ? data.join() : data;
							var command = item + '(' + args + ')';
							board.send( command );
						});
					});
				}
				else 
				{ 
					throw new Error('config.toROV needs to be an array.');
				}
			}
		}
		
	}, false );
	
	board.AddMethod( "StartSerial", function()
	{
		// Connect to the MCU
        board.bridge.connect();

        // Every few seconds we check to see if capabilities or settings changes on the arduino.
        // This handles the cases where we have garbled communication or a firmware update of the arduino.
        board.safeCheck = setInterval( function () 
        {
            if( board.notSafeToControl() === false ) 
            {
                return;
            }
            
            board.updateSetting();
            board.requestSettings();
            board.requestCapabilities();
        }, 1000);
		
	}, false );
	
	board.AddMethod( "StopSerial", function()
	{
		// Close the bridge connection
        board.bridge.close();
		
		// Remove the safeCheck interval
		board.safeCheck = {};
		
	}, false );
	
	board.AddMethod( "StartRawSerial", function()
	{
		board.bridge.startRawSerialData();
	}, false );
	
	board.AddMethod( "StopRawSerial", function()
	{
		board.bridge.stopRawSerialData();
	}, false );
}

module.exports = SetupBoardInterface;
