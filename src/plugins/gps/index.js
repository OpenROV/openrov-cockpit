var gpsd = require( 'node-gpsd' );
  
function GPS(name, deps) 
{
  var self = this;
  
	// Instance variables
	this.deps 	  = deps; 		
	this.cockpit 	= deps.cockpit;
	this.global   = deps.globalEventLoop;
  
	this.isConnecting 				    = false;
	this.automaticallyReconnect 	= true;
	this.reconnectTimer           = {};
  
  if( process.env.USE_MOCK == "true" )
  {
    setInterval( function()
    {
      var tpv =
      {
     
        lat: 39.0916667 + (Math.random() * 0.0050 ),
        lon: -119.9542667 + (Math.random() * 0.0050 ),
        speed: 0.1,
        alt: 6000
      };
        
      self.cockpit.emit( 'plugin.gps.TPV', tpv );
    }, 1000 );
  }
  else
  {
    this.global.withHistory.on('settings-change.gps',function( data )
    {
      self.listener = new gpsd.Listener(
      {
        port: 2947,
        hostname: data.gps.server,
        logger: 
        {
          info: function() {},
          warn: console.warn,
          error: console.error
        },
        parse: true
      } );
      
      // Register callbacks for events emitted by the listener
      self.registerListenerEvents();

      // Start attempts to connect to gpsd
      self.connectToGpsd();
    });
  }
  
}

GPS.prototype.start = function start()
{
  console.log( "GPS plugin started" );
}

GPS.prototype.registerListenerEvents = function()
{
  var self = this;

  // GPSD Event Listeners
  self.listener.on( 'TPV', function( data ) 
  {
    self.cockpit.emit( 'plugin.gps.TPV', data );
  });
  
  self.listener.on( 'SKY', function( data ) 
  {
    self.cockpit.emit( 'plugin.gps.SKY', data );
  });
  
  self.listener.on( 'GST', function( data ) 
  {
    self.cockpit.emit( 'plugin.gps.GST', data );
  });
  
  self.listener.on( 'ATT', function( data ) 
  {
    self.cockpit.emit( 'plugin.gps.ATT', data );
  });

  // Connection Event listeners  
  self.listener.on( 'connected', function( data ) 
  {
    console.log( 'gps - Connected to gpsd!' );
    self.cockpit.emit( 'plugin.gps.connected' );
  });
  
  self.listener.on( 'disconnected', function( data ) 
  {
    console.log( 'gps - Disconnected from gpsd: ' + data );
    self.cockpit.emit( 'plugin.gps.disconnected' );
    
    // Retry in 10 seconds
    setTimeout( function()
    {
      if( self.automaticallyReconnect )
      {
	self.connectToGpsd();
      }
    }, 10000 );
  });
  
  self.listener.on( 'error', function( data ) 
  {
    console.log( 'gps - Error occurred: ' + data );
    
    // Clear the reconnect timer, if we aren't configured to reconnect
    if( !self.automaticallyReconnect && self.reconnectTimer )
    {
		clearInterval( self.reconnectTimer );
    }
  });
};

GPS.prototype.connectToGpsd = function()
{
    console.log( 'gps - Attempting to connect to gpsd...' );

	var self = this;

    // Start the connection
    self.listener.connect( function() 
    {
      // On successful connect, announce ourselves as a watcher to GPSD
      self.listener.watch();
    } ); 
};

// This is all that is required to enable settings for a plugin. They are
// automatically made editable, saved, etc from this definition.
GPS.prototype.getSettingSchema = function getSettingSchema()
{
  return [
  {
    "title": "GPS Settings",
    "id" :"gps",
    "type" : "object",
    "properties": 
    {
      "server": 
      {
        "type": "string",
        "default" : "192.168.250.10"
      }
    }
  }];
};

module.exports = function( name, deps ) 
{
  return new GPS( name, deps );
};
