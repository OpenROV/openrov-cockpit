const exec = require('child_process')
    .exec;
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
    console.log('The geo-mux plugin.');
    var self = this;
    this.deps = deps;
    this.services = {};
    var emitter = new events.EventEmitter();
    var global = deps.globalEventLoop;
    var cockpit = deps.cockpit;
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
    videoServer.on('video-deviceRegistration', function(update) {
        console.log('Got device update'); // self.deps.globalEventLoop.emit('video-deviceRegistration',update);
    });
    // Video endpoint announcement
    videoServer.on('geomux.video.announcement', function(camera, channel, info) {
        console.log('Announcement info: ' + JSON.stringify(info));
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
        console.log('Successfully connected to geo-video-server');
        // Tell geo-video-server to start the daemons
        videoServer.emit('geomux.ready');
    });
    // Disconnection
    videoServer.on('disconnect', function() {
        console.log('Disconnected from video server.');
    });
    // Error
    videoServer.on('error', function(err) {
        console.log('Video Server Connection Error: ' + err);
    });
    // Reconnect attempt
    videoServer.on('reconnect', function() {
        console.log('Attempting to reconnect');
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
// This gets called when plugins are started
geomux.prototype.start = function start() 
{
    console.log('geo:start');
    var geoprogram = '';

    // Figure out which video server to use
    if( process.env.USE_MOCK == 'true' )
    {
      if (process.env.GEO_MOCK == 'true') 
      {
          geoprogram = require.resolve('geo-video-simulator');
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
            console.error('geo-video-server not installed');
            return;
        }
    }

    // Create all launch options
    var launch_options = [
        'nice',
        '--19',
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
    ];
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
        console.log('Geo-video-server exited. Code: [' + code + '] Signal: [' + signal + ']');
    });
    monitor.on('stdout', function(data) {
        var msg = data.toString('utf-8');
        console.log('geo-video-server STDOUT: ' + msg);
    });
    monitor.on('stderr', function(data) {
        var msg = data.toString('utf-8');
        console.error('geo-video-server STDERR: ' + msg);
    });
    // Start the monitor
    monitor.start();
};
//Export provides the public interface
module.exports = function(name, deps) {
    return new geomux(name, deps);
};
