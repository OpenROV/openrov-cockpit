const exec    = require('child_process').exec;
const fs      = require('fs');
const path    = require('path');
const respawn = require('respawn');
const io      = require('socket.io-client');
const events  = require('events');

var defaults =
{
  port: 8099,
  wspath: "/geovideo"
};

var geomux = function geomux( name, deps ) 
{
  console.log('The geo-mux plugin.');
  var self      = this;
  
  this.deps     = deps;
  this.services = {};
  
  var emitter     = new events.EventEmitter();
  var global      = deps.globalEventLoop;
  var cockpit     = deps.cockpit;
  var videoServer = io.connect( 'http://localhost:' + defaults.port, { path: defaults.wspath, reconnection: true, reconnectionAttempts: Infinity, reconnectionDelay: 10 } );

  
  var cameras     = {};
  
  // Upon connecting to video server, set up listeners
  videoServer.on( "connect", function()
  {
    console.log( "Successfully connected to geo-video-server" );
    
    // ----------------------------
    // Register all other listeners
    
    cockpit.on( "plugin.geomuxp.command", function( camera, command, params )
    {
      // Forward to geo-video-server
      videoServer.emit( "geomux.command", camera, command, params );
    } );
    
    // Video endpoint announcement
    videoServer.on( "geomux.video.announcement", function( camera, channel, info )
    {
      console.log( "Announcement info: " + JSON.stringify( info ) );
      
      // Emit message on global event loop to register with the Video plugin
      self.deps.globalEventLoop.emit('CameraRegistration',
      { 
        location:           info.txtRecord.cameraLocation,
        videoMimeType:      info.txtRecord.videoMimeType,
        resolution:         info.txtRecord.resolution,
        framerate:          info.txtRecord.framerate,
        wspath:             info.txtRecord.wspath,
        relativeServiceUrl: info.txtRecord.relativeServiceUrl,
        sourcePort:         info.port,
        sourceAddress:      info.addresses[0],
        connectionType:     'socket.io'
      });
    });
    
    // Channel settings
    videoServer.on( "geomux.channel.settings", function( camera, channel, settings )
    {
      UpdateCameraInfo( camera, channel );
      self.deps.cockpit.emit("plugin.geomuxp." + camera + "_" + channel + ".settings", settings );
    } );
    
    // Channel health
    videoServer.on( "geomux.channel.health", function( camera, channel, health )
    {
      UpdateCameraInfo( camera, channel );
      self.deps.cockpit.emit("plugin.geomuxp." + camera + "_" + channel + ".health", health );
    });
    
    // Channel api
    videoServer.on( "geomux.channel.api", function( camera, channel, api )
    {
      UpdateCameraInfo( camera, channel );
      self.deps.cockpit.emit("plugin.geomuxp." + camera + "_" + channel + ".api", api );
    });
    
    // Channel status
    videoServer.on( "geomux.channel.status", function( camera, channel, status )
    {
      UpdateCameraInfo( camera, channel );
      self.deps.cockpit.emit("plugin.geomuxp." + camera + "_" + channel + ".status", status );
    });
    
    // Channel error
    videoServer.on( "geomux.channel.error", function( camera, channel, error )
    {
      UpdateCameraInfo( camera, channel );
      self.deps.cockpit.emit("plugin.geomuxp." + camera + "_" + channel + ".error", error );
    });
    
    // Tell geo-video-server to start the daemons
    videoServer.emit( "geomux.ready" );
  });
  
  videoServer.on( "disconnect", function()
  {
    console.log( "Disconnected from video server." );
  });
  
  videoServer.on( "error", function( err )
  {
    console.log( "Video Server Connection Error: " + err );
  });
  
  // Connect to video server
  videoServer.on( "reconnect", function()
  {
    console.log( "Attempting to reconnect" );
  });
  
  function UpdateCameraInfo( camera, channel )
  {
    if( cameras[ camera ] === undefined )
    {
      // Create the camera
      cameras[ camera ] = {};
      
      // Add the channel
      cameras[ camera ][ channel ] = {};
      
      self.deps.cockpit.emit( "plugin.geomuxp.cameraInfo", cameras );
    }
    else if( cameras[ camera ][ channel ] === undefined )
    {
      // Add the channel
      cameras[ camera ][ channel ] = {};
      
      self.deps.cockpit.emit( "plugin.geomuxp.cameraInfo", cameras );
    }
    
    // No changes, no need to emit update
  }
}

var timeoutscale = .1;

// This gets called when plugins are started
geomux.prototype.start = function start()
{
  console.log('geo:start');
  
  var self=this;
  
  BootCameras(function()
  {
    EnumerateCameras(function(results)
    {
      if (results.length==0)
      {
        setTimeout(self.start.bind(this),1000*120*timeoutscale);
        
        if (timeoutscale<1)
        {
          timoutscale+=.1;
        }
        
        return;
      }
      
      self.deps.globalEventLoop.emit('video-deviceRegistration',results);
      
      sortedResults = results.sort( function(a,b){ return a.device.localeCompare(b.device) } );
      StartCameras( sortedResults );
    })
  });
}

// -----------------------
// Helper functions
  
// Creates a list with all of the dectected video devices
function EnumerateCameras( callback )
{
  var results = [];
  var i = 0;
  
  fs.readdir('/dev', function (err, files) 
  {
    if(err) 
    {
      callback( results );
    }
    
    var f = files.filter( function(file)
    {
        return file.indexOf('video') == 0;
    });
    
    if (f.length==0)
    {
      callback(result);
      return;
    }
    
    f.forEach(function(file)
    {
      i++;
      exec('udevadm info --query=all --name=/dev/' + file + ' | grep "S: v4l/by-id/"', function(error, stdout, stderr)
      {
        if ((error == null) && (stdout.indexOf('GEO_Semi_Condor')>0))
        {
          var result = 
          {
            device:   file.slice( "video".length ),
            deviceid: stdout.slice("S: v4l/by-id/".length),
            format:   'MP4'
          }

          results.push( result );
        }
        
        i--;
        
        if( i == 0 )
        {
          callback(results)
        };
      });
    });
  });
}

function BootCameras( callback )
{
    exec('mxcam list | grep "Core: Condor"', function(error, stdout, stderr)
    {
      if (error == null)
      {
        exec(path.dirname(require.resolve('geo-video-server'))+'/platform/linux/bootcamera.sh', function(error, stdout, stderr)
        {
          // give the system a moment to stabalize after the bootcamera script
          setTimeout(function()
          {
            callback();
          },1000);  
        } );
      } 
      else 
      {
        console.error('Error staring devices geo: ',JSON.stringify(error));
        callback();
      }
    });
}

function StartCameras( cameras )
{
  var geoprogram = '';
 
  // Find the geo-video-server app
  try 
  {
    geoprogram =require.resolve('geo-video-server')
  } 
  catch (er) 
  {
    console.log("geo-video-server not installed")
    return;
  }

  // Create list of cameras to start up
  var cameraArgs = "-c=[";
  for( var i = 0; i < cameras.length; i++ ) 
  {
    if( i === cameras.length - 1 )
    {
      cameraArgs = cameraArgs.concat( cameras[ i ].device );
    }
    else
    {
      cameraArgs = cameraArgs.concat( cameras[ i ].device + "," );
    }
  }
  cameraArgs = cameraArgs.concat( "]" );
  
  // Set logging arguments
  var debugArgs     = "app*,camera*,channel*";
  
  // Create all launch options
  var launch_options = 
  [ 
    "nice", "-1",
    "node", geoprogram,
    cameraArgs
  ];
  
  const infinite = -1;
  
  // Launch the video server with specified options. Attempt to restart every 1s.
  var monitor = respawn( launch_options,
  {
      name: 'geomux',
      env: 
      { 
        "DEBUG": debugArgs,
        "GEO_WSPATH": defaults.wspath,
        "GEO_PORT": defaults.port
      },
      maxRestarts: infinite,
      sleep: 1000
  } );

  var self = this;
  
  monitor.on('crash',function()
  {
      console.log("crashed");
  });
  
  monitor.on('spawn',function(process)
  {
      console.log("spawned");
  });
  
  monitor.on('warn',function(error)
  {
      console.log("error: " + error);
  });
  
  monitor.on('exit',function(code, signal)
  {
      console.log("code: " + code + " signal: " + signal );
  });

  // Optional stdio logging
  monitor.on('stdout',function(data)
  {
      var msg = data.toString('utf-8');
      console.log(msg);
  });

  monitor.on('stderr',function(data)
  {
      var msg = data.toString('utf-8');
      console.log(msg);
  });

  console.log( "Starting geovideoserver" );
  monitor.start();
};

//Export provides the public interface
module.exports = function (name, deps) 
{
  return new geomux(name,deps);
};
