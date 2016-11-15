(function (window, document, jQuery) 
{
  //The function wrapper prevents leaking variables to global space
  'use strict';

  var Video;

  //These lines register the Video object in a plugin namespace that makes
  //referencing the plugin easier when debugging.
  var plugins   = namespace('plugins');
  plugins.Video = Video;

  Video = function Video(cockpit) 
  {
    console.log('Loading video plugin in the browser.');

    //instance variables
    this.cockpit = cockpit;
    this.rov = cockpit.rov;

    // for plugin management:
    this.Plugin_Meta = 
    {
      name: 'video',
      viewName: 'Video plugin',
      defaultEnabled: true
    };
  };

  var StartWorker = function (code) 
  {
    var lines = code.split('\n');
    lines.splice(0, 1);
    lines.splice(lines.length - 2, 2);

    var worker  = lines.join('\n');
    var blob    = new Blob([worker]);
    var blobURL = window.URL.createObjectURL(blob);
    var worker  = new Worker(blobURL);

    window.URL.revokeObjectURL(blobURL);

    return worker;
  };

  var ResolveURL = function( candidateURL ) 
  {
    var http    = location.protocol;
    var slashes = http.concat('//');
    var host    = slashes.concat(window.location.hostname);

    // Just return fully qualifed addresses
    if( candidateURL.startsWith( 'http' ) ) 
    {
      // Use the URL as is
      return candidateURL;
    }

    //if a port is defined, use it
    if( candidateURL.startsWith(':') ) 
    {
      // Append host to rest of url that includes a new port
      return host.concat( candidateURL );
    } 
    else 
    {
      //we have a relative or absolute URL to the existing host+port
      if (window.location.port != '' && window.location.port != '443' && window.location.port != '80') 
      {
        host.concat(':' + window.location.port);
      }
    }

    return host.concat(candidateURL);
  };

  // listen gets called by the plugin framework after all of the plugins have loaded.
  Video.prototype.listen = function listen() 
  {
    var self = this;
    var CameraRegistrations = {};

    this.rov.withHistory.on('CameraRegistration', function (data) 
    {
      //TODO: More robust handling of duplicat CameraRegistration messages.  If the Camera
      //already is setup, we want to ignore.  But we also want to handle multiple Cameras
      //and camera's that change settings.
      data.sourceAddress = ResolveURL( data.relativeServiceUrl );

      if( CameraRegistrations[ data.sourceAddress ] ) 
      {
        return;
      }

      CameraRegistrations[ data.sourceAddress ] = true;

      switch( data.connectionType ) 
      {
      case 'ws':
        data.sourceAddress = ResolveURL( data.relativeServiceUrl );

        // Connect to websocket
        var ws = new WebSocket( data.sourceAddress.replace( "http", "ws" ) );

        var forwardPacket = function( packet ) 
        {
          self.cockpit.emit( 'x-motion-jpeg.data', packet );
        };

        // Set up ws listener to draw frames
        ws.onmessage = function( evt ) 
        {
            self.cockpit.emit( 'x-motion-jpeg.data', evt.data );
        };

        ws.onclose = function() 
        {
            console.log( "Lost connection to video websocket. Removing registration." );
            CameraRegistrations[ data.sourceAddress.replace( "ws", "http" ) ] = false;
        };

        self.cockpit.emit( 'CameraRegistration', data );
        break;

      case 'wss':
        data.sourceAddress = ResolveURL( data.relativeServiceUrl );

        // Connect to websocket
        var ws = new WebSocket( data.sourceAddress.replace( "http", "wss" ) );

        var forwardPacket = function( packet ) 
        {
          self.cockpit.emit( 'x-motion-jpeg.data', packet );
        };

        // Set up ws listener to draw frames
        ws.onmessage = function( evt ) 
        {
            self.cockpit.emit( 'x-motion-jpeg.data', evt.data ); 
        };

        ws.onclose = function() 
        {
            console.log( "Lost connection to video websocket. Removing registration." );
            CameraRegistrations[ data.sourceAddress.replace( "ws", "http" ) ] = false;
        };

        self.cockpit.emit( 'CameraRegistration', data );
        break;

      case 'http':
        //pass on to MJPEG player that will connect over http
        data.sourceAddress = ResolveURL(data.relativeServiceUrl);
        self.cockpit.emit('CameraRegistration', data);
        break;

      case 'socket.io':
        //create the connection and pass data to the cocpkit bus for processing
        var connection;
        data.sourceAddress = ResolveURL(data.relativeServiceUrl);
        connection = window.io.connect(data.sourceAddress, { path: data.wspath });
        var handleInit = function (fn) {
          connection.emit('request_Init_Segment', function (data) {
            fn(data);
          });
        };
        var handleData = function (data) {
          self.cockpit.emit('x-h264-video.data', data);
        };
        var handleMjpegData = function (data) {
          self.cockpit.emit('x-motion-jpeg.data', data);
        };
        //TODO: abstract the messages enough that we can have multiple cameras controls
        self.cockpit.on('request_Init_Segment', handleInit);
        connection.on('x-h264-video.data', handleData);
        connection.on('x-motion-jpeg.data', handleMjpegData);
        connection.on('connect', function () {
          console.log('connected to socket.io video server end point');
        });
        self.cockpit.emit('CameraRegistration', data);
        break;

      case 'rov':
        //data is comming over the rov bus, just pass it on to the cockpit bus
        var dataflowing = false;
        //this wont work for multiple cameras.
        self.rov.on('x-h264-video.data', function (data) {
          self.cockpit.emit('x-h264-video.data', data);
          if (!dataflowing) {
            dataflowing = true;
            self.cockpit.on('request_Init_Segment', function (fn) {
              var handler = function (data) {
                fn(data);
                self.rov.off('x-h264-video.init', handler);
              };
              self.rov.on('x-h264-video.init', handler);
              self.rov.emit('request_Init_Segment');
            });
          }
        });
        self.cockpit.emit('CameraRegistration', data);
        break;

      default:
        console.error('Unrecognized camera registration connectionType:', data.connectionType);
      }

    });
  };
  window.Cockpit.plugins.push(Video);
}(window, document, $));