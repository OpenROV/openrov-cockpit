const exec = require('child_process').exec;
const fs = require('fs');
const respawn = require('respawn');
const util = require('util');
const Q = require('q');
const io = require('socket.io-client');
var log = require('debug')('app:log:mjpeg');
var server = require('debug')('app:log:mjpeg:server');
var error = require('debug')('app:error:mjpeg');
var mjpegvideo = function mjpegvideo(name, deps) {
  console.log('The mjpeg-video plugin.');
  //state variables
  this.deps = deps;
  var self = this;
  this.services = {};
};
var defaults = {
    port: 8090,
    wspath: '/mjpeg-video'
  };
mjpegvideo.prototype.enumerateDevices = function enumerateDevices() {
  var deferred = Q.defer();
  var launch_options = [
      'node',
      require.resolve('mjpeg-video-server'),
      '-e',
      'true'
    ];

  if (process.env.MJPG_MOCK === 'true') {
    launch_options.push('-m');
    launch_options.push('true');
 //   launch_options.splice(1,0,'--debug-brk=15858');
  }

  exec(launch_options.join(' '), { env: { DEBUG: process.env.DEBUG } }, function (error, stdout, stderr) {
    if (error) {
      deferred.reject(error);
    }
    var cameras = [];
    try {
      cameras = JSON.parse(stdout);
    } catch (e) {
    }
    if (cameras && util.isArray(cameras) && cameras.length > 0) {
      deferred.resolve(cameras);
    } else {
      var cameras = [];
      deferred.resolve(cameras);
    }
  });
  return deferred.promise;
};
mjpegvideo.prototype.start = function start() {
  var self = this;
    // self.deps.cockpit.on('plugin.mjpeg-video.start', function(device) {
    //   self.startCamera('/dev/' + device);
    //   self.connectVideoServer();
    // });
    self.enumerateDevices().then(function (cameras) {
      if (cameras && cameras.length > 0) {
        self.startVideoServer();
        self.connectVideoServer();  // log('Found cameras ' + JSON.stringify(cameras));
        //self.deps.cockpit.emit("plugin.mjpeg-video.cameraInfo", cameras);
      }
    });

};
mjpegvideo.prototype.connectVideoServer = function () {
  var self = this;
  log('Connecting to video server');
  var videoServer = io.connect('http://localhost:' + defaults.port, {
      path: defaults.wspath,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 10
    });
  self.deps.cockpit.on('plugin.mjpeg-video.start', function (device) {
    videoServer.emit('video.start', device);
  });
  videoServer.on('video-deviceRegistration', function (result) {
    self.deps.cockpit.emit('plugin.mjpeg-video.deviceRegistration', result);
    log('mjpeg-video got device registration: ' + JSON.stringify(result));
  });
  // Video endpoint announcement
  videoServer.on('mjpeg-video.channel.announcement', function (camera, info) {
    log('Announcement info: ' + JSON.stringify(info));
    // Emit message on global event loop to register with the Video plugin
    self.deps.globalEventLoop.emit('CameraRegistration', {
      location: info.txtRecord.cameraLocation,
      videoMimeType: info.txtRecord.videoMimeType,
      resolution: info.txtRecord.resolution,
      framerate: info.txtRecord.framerate,
      wspath: info.txtRecord.wspath,
      relativeServiceUrl: info.txtRecord.relativeServiceUrl,
      sourcePort: info.port,
      sourceAddress: '',
      connectionType: 'socket.io'
    });
  });
};
mjpegvideo.prototype.startVideoServer = function startVideoServer(device) {
  var launch_options = [
      'node',
      require.resolve('mjpeg-video-server')
    ];
  var mock = false;
  if (process.env.MJPG_MOCK === 'true') {
    launch_options.push('-m');
    launch_options.push('true');
    launch_options.push('-u');
    launch_options.push(':8090/?action=stream');
  //  launch_options.splice(1,0,'--debug-brk=15858');
    launch_options.splice(1,0,'--debug=15858');
  }
  const infinite = -1;
  log('Starting mjpeg-video-server ' + launch_options);
  var monitor = respawn(launch_options, {
      name: 'mjpegserver',
      maxRestarts: infinite,
      sleep: 1000,
      env: { DEBUG: process.env.DEBUG }
    });
  monitor.on('stdout', function (data) {
    server(data.toString('utf-8'));
  });
  var self = this;
  monitor.on('stderr', function (data) {
    var msg = data.toString('utf-8');
    var service;
    try {
      service = JSON.parse(msg);
    } catch (e) {
      server('mjpeg-video-server STDERR: ' + msg);
      return;  //abort, not a json message
    }
  });
  monitor.on('exit', function () {
    log('mjpeg-video-server exit');
  });
  monitor.on('crash', function () {
    log('mjpeg-video-server crash');
  });
  monitor.start();
};
//Export provides the public interface
module.exports = function (name, deps) {
  return new mjpegvideo(name, deps);
};