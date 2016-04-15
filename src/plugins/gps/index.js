function GPS(name, deps) 
{
	// Instance variables
	this.deps 	= deps; 		// hold a reference to the plugin dependencies if you are going to use them
	this.rov 		= deps.rov; 	// explicitlly calling out the rov eventemitter
	this.cockpit 	= deps.cockpit; // explicitly calling out cockpit eventemitter
	
	var gpsd = require( 'node-gpsd' );
	
	this.isConnecting 				= false;
	this.automaticallyReconnect 	= true;
	this.reconnectTimer;
	
	this.listener = new gpsd.Listener(
	{
		port: 2947,
		hostname: '192.168.254.210',
		logger: 
		{
			info: function() {},
			warn: console.warn,
			error: console.error
		},
		parse: true
	} ); 
}

GPS.prototype.start = function start()
{
  // Register callbacks for events emitted by the listener
  this.registerListenerEvents();

  // Start attempts to connect to gpsd
  this.connectToGpsd();
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

module.exports = function( name, deps ) 
{
  return new GPS( name, deps );
};
