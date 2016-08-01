(function(window) {
  'use strict';
  
  var plugins = namespace('plugins');
  
  plugins.GPS = function(cockpit) 
  {
    var self = this;
    self.cockpit = cockpit;

  };

  //This pattern will hook events in the cockpit and pull them all back
  //so that the reference to this instance is available for further processing
  plugins.GPS.prototype.listen = function listen() {
    var self = this;

    self.cockpit.rov.on('plugin.gps.TPV', function(data) 
    {
      if('lat' in data && 'lon' in data )
      {
        var gpsData = 
        {
          lat: data.lat,
          lon: data.lon,
          speed: data.speed,
          alt: data.alt
        }
        
        self.cockpit.emit( "plugin.gps.data", gpsData );
        
        console.log( "GPS Fix: [lat,lon]: [" + data.lat + "," + data.lon + "]" );
      }
    });
  };

  window.Cockpit.plugins.push(plugins.GPS);

})(window);
