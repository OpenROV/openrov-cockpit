( function ( window, document, jQuery )
{
	'use strict';
	var Geomuxp;

	// Register plugin
	var plugins = namespace( 'plugins' );
	plugins.Geomuxp = Geomuxp;

	Geomuxp = function Geomuxp( cockpit ) 
	{
		console.log( 'Loading geomuxp plugin in the browser.' );
		
		var self		= this;
		this.cockpit 	= cockpit;
		this.rov 		= cockpit.rov;		

		this.pluginDefaults = 
		{
			name : 'geomuxp',
			viewName : 'Geomuxp plugin',
			canBeDisabled : false,
			defaultEnabled: true
		};
		
		// Geomux state
		this.cameras	= {};
		
		// Whenever a new channel comes online, register its event listeners
		this.rov.withHistory.on( "plugin.geomuxp.cameraInfo", function( cameras )
		{
			Object.keys( cameras ).map( function( cam ) 
			{
				Object.keys( cam ).map( function( chan )
				{
					// Leave unmodified, or create new camera if it didn't exist
					self.cameras[ cam ] = self.cameras[ cam ] || {};
					
					// Check to see if channel exists
					if( self.cameras[ cam ][ chan ] === undefined )
					{
						// Add channel
						self.cameras[ cam ][ chan ] = {};
						
						// Register to updates from the server
						self.rov.withHistory.on( "plugin.geomuxp." + cam + "_" + chan + ".settings", function( settings )
						{
							console.log( "Got settings: " + JSON.stringify( settings ) );
							self.cockpit.emit( "plugin.geomuxp." + cam + "_" + chan + ".settings", settings );
						} );
						
						self.rov.withHistory.on( "plugin.geomuxp." + cam + "_" + chan + ".api", function( api )
						{
							console.log( "Got API: " + JSON.stringify( api ) );
							self.cockpit.emit( "plugin.geomuxp." + cam + "_" + chan + ".api", api );
						} );
						
						self.rov.withHistory.on( "plugin.geomuxp." + cam + "_" + chan + ".health", function( health )
						{
							console.log( "Got health: " + JSON.stringify( health ) );
							self.cockpit.emit( "plugin.geomuxp." + cam + "_" + chan + ".health", health );
						} );
						
						self.rov.withHistory.on( "plugin.geomuxp." + cam + "_" + chan + ".status", function( status )
						{
							console.log( "Got status: " + status );
							self.cockpit.emit( "plugin.geomuxp." + cam + "_" + chan + ".status", status );
						} );
						
						self.rov.withHistory.on( "plugin.geomuxp." + cam + "_" + chan + ".error", function( error )
						{
							console.log( "Got error: " + error );
							self.cockpit.emit( "plugin.geomuxp." + cam + "_" + chan + ".error", error );
						} );
					}
				} );
			} );
		} );
		
		this.cockpit.on( "plugin.geomuxp.command", function( camera, command, params ) 
		{
			console.log( "Got command" );
			
			// Forward to server
			self.rov.emit( "plugin.geomuxp.command", camera, command, params );
		} );
	};

	Geomuxp.prototype.inputDefaults = function inputDefaults()
	{
		var self = this;
		return [];
	};

	window.Cockpit.plugins.push( Geomuxp );
}( window, document, $ ) );
