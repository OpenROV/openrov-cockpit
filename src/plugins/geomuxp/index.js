var logger;

const exec = require('child_process').exec;
const fs = require('fs');
const path = require('path');
const respawn = require('respawn');
const io = require('socket.io-client');
const events = require('events');

var defaults = {
    port: 8099,
    wspath: '/geovideo'
};

var geomux = function geomux(name, deps) {
    logger= deps.logger;

    logger.info('The geo-mux plugin.');
    var self = this;
    this.deps = deps;
    this.services = {};
    var emitter = new events.EventEmitter();
    var global = deps.globalEventLoop;
    var cockpit = deps.cockpit;
    this.flag_experimentH264 = false;
    this._monitor = null;
    var videoServer = io.connect('http://localhost:' + defaults.port, {
        path: defaults.wspath,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 10
    });
    var cameras = {};
    // ----------------------------
    // Register all other listeners
    cockpit.on('plugin.geomuxp.command', function(camera, command, params) {
        // Forward to geo-video-server
        videoServer.emit('geomux.command', camera, command, params);
    });

    global.withHistory.on('settings-change.videosettings',function(settings){
        if ((flag_experimentH264!==settings.videosettings['use-geoserve']) && (_monitor !== null)){
            this.stop();
            this.start();
        }
        flag_experimentH264=settings.videosettings['use-geoserve'];
    });

    videoServer.on('video-deviceRegistration', function(update) {
        logger.debug('Got device update');
    });
    // Video endpoint announcement
    videoServer.on('geomux.video.announcement', function(camera, channel, info) {
        logger.debug('Announcement info: ' + JSON.stringify(info));
        // Emit message on global event loop to register with the Video plugin
        self.deps.globalEventLoop.emit('CameraRegistration', {
            location: info.txtRecord.cameraLocation,
            videoMimeType: info.txtRecord.videoMimeType,
            resolution: info.txtRecord.resolution,
            framerate: info.txtRecord.framerate,
            wspath: info.txtRecord.wspath,
            relativeServiceUrl: info.txtRecord.relativeServiceUrl,
            sourcePort: info.port,
            sourceAddress: info.addresses[0],
            connectionType: 'socket.io'
        });
    });
    // Channel settings
    videoServer.on('geomux.channel.settings', function(camera, channel, settings) {
        UpdateCameraInfo(camera, channel);
        self.deps.cockpit.emit('plugin.geomuxp.' + camera + '_' + channel + '.settings', settings);
    });

    // Channel health
    videoServer.on('geomux.channel.health', function(camera, channel, health) {
        UpdateCameraInfo(camera, channel);
        self.deps.cockpit.emit('plugin.geomuxp.' + camera + '_' + channel + '.health', health);
    });
    // Channel api
    videoServer.on('geomux.channel.api', function(camera, channel, api) {
        UpdateCameraInfo(camera, channel);
        self.deps.cockpit.emit('plugin.geomuxp.' + camera + '_' + channel + '.api', api);
    });
    // Channel status
    videoServer.on('geomux.channel.status', function(camera, channel, status) {
        UpdateCameraInfo(camera, channel);
        self.deps.cockpit.emit('plugin.geomuxp.' + camera + '_' + channel + '.status', status);
    });
    // Channel error
    videoServer.on('geomux.channel.error', function(camera, channel, error) {
        UpdateCameraInfo(camera, channel);
        self.deps.cockpit.emit('plugin.geomuxp.' + camera + '_' + channel + '.error', error);
    });
    // Upon connecting to video server, set up listeners
    videoServer.on('connect', function() {
        logger.info('Successfully connected to geo-video-server');
        // Tell geo-video-server to start the daemons
        videoServer.emit('geomux.ready');
    });
    // Disconnection
    videoServer.on('disconnect', function() {
        logger.info('Disconnected from video server.');
    });
    // Error
    videoServer.on('error', function(err) {
        logger.error(err,'Video Server Connection Error');
    });
    // Reconnect attempt
    videoServer.on('reconnect', function() {
        logger.info('Attempting to reconnect');
    });
    // Helper function to update local store of cameras and channels
    function UpdateCameraInfo(camera, channel) {
        if (cameras[camera] === undefined) {
            // Create the camera
            cameras[camera] = {};
            // Add the channel
            cameras[camera][channel] = {};
            self.deps.cockpit.emit('plugin.geomuxp.cameraInfo', cameras);
        } else if (cameras[camera][channel] === undefined) {
            // Add the channel
            cameras[camera][channel] = {};
            self.deps.cockpit.emit('plugin.geomuxp.cameraInfo', cameras);
        }
    }
};

geomux.prototype.start = function stop() 
{
    logger.info('Stopping geomux program');
    _monitor.stop();
    _monitor = null;
}

// This gets called when plugins are started
geomux.prototype.start = function start() 
{
    logger.info('Starting geomux program');
    var geoprogram = '';

    // Figure out which video server to use
    if( process.env.USE_MOCK == 'true' )
    {
      if (process.env.MOCK_VIDEO_TYPE === "GEOMUX")
      {
          geoprogram = require.resolve('geo-video-simulator');
      }
      else
      {
          return;
      }
    }
    else
    {
        // Find the geo-video-server app
        try 
        {
            geoprogram = require.resolve('geo-video-server');
        } 
        catch (er) 
        {
            logger.error('geo-video-server not installed');
            return;
        }
    }

    var launch_options = [];
    if( process.env.USE_MOCK != 'true' ){
        //Don't use platform specific nice in mock mode
        launch_options= launch_options.concat([
        'nice',
        '--19'     
        ])
    }

  if (this.flag_experimentH264){
   launch_options = launch_options.concat([
       'geoserve'
   ])
  } else {
 
    // Create all launch options
   launch_options = launch_options.concat([
        'node',
        geoprogram,
        '--p',
        defaults.port,
        '--w',
        defaults.wspath,
        '--c',
        0,
        '--u',
        process.env.DEV_MODE === 'true' ? ':8099' : ''
   ]);
  }
    const infinite = -1;
    // Set up monitor with specified options
    var monitor = respawn(launch_options, {
        name: 'geomux',
        env: {
            'DEBUG': 'app*,camera*,channel*'
        },
        maxRestarts: infinite,
        sleep: 1000
    });
    monitor.on('exit', function(code, signal) {
        logger.error('Geo-video-server exited. Code: [' + code + '] Signal: [' + signal + ']');
    });
    monitor.on('stdout', function(data) {
        var msg = data.toString('utf-8');
        logger.debug('geo-video-server STDOUT: ' + msg);
    });
    monitor.on('stderr', function(data) {
        var msg = data.toString('utf-8');
        logger.debug('geo-video-server STDERR: ' + msg);
    });
    // Start the monitor
    monitor.start();
    this._monitor = monitor;
};
//Export provides the public interface
module.exports = function(name, deps) {
    return new geomux(name, deps);
};
