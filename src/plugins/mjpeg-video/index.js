const exec=require('child_process').exec;
const fs=require('fs');
const respawn = require('respawn');
const util = require('util');
const Q = require('q');
const io = require('socket.io-client');

var mjpegvideo = function mjpegvideo(name, deps) {
  console.log('The mjpeg-video plugin.');

  //state variables
  this.deps = deps;
  var self=this;
  this.services={};

}

var defaults =
{
  port: 8090,
  wspath: "/mjpeg-video"
};


mjpegvideo.prototype.enumerateDevices = function enumerateDevices(){

  var deferred = Q.defer();
  var launch_options = ['node', require.resolve('mjpeg-video-server'), '-e', 'true'];
  exec(launch_options.join(' '), {env: {DEBUG: process.env.DEBUG }}, function(error, stdout, stderr){
    if (error) {
      deferred.reject(error);
    }
    var cameras = JSON.parse(stdout);
    if (cameras && util.isArray(cameras) && cameras.length > 0)
    {
      deferred.resolve(cameras);
    }
    else 
    {
      var cameras = []; 
      deferred.resolve(cameras);
    }
  
  });
  return deferred.promise;
}


mjpegvideo.prototype.start = function start(){
  var self = this;
  //if (config.preferences.video)
  if (process.env.MJPG_MOCK === 'true'){
      self.startCamera('/dev/video0');
  } else {
    this.enumerateDevices()
      .then(function(cameras) {
        if (cameras.length > 0) {
          // self.deps.globalEventLoop.emit('video-deviceRegistration',results);

          var videoServer = io.connect( 'http://localhost:' + defaults.port, 
            { 
              path: defaults.wspath, 
              reconnection: true, 
              reconnectionAttempts: Infinity, 
              reconnectionDelay: 10 
            } );

          videoServer.on('video-deviceRegistration', function(result) {
            self.deps.globalEventLoop.emit('video-deviceRegistration',result);
            console.log('mjpeg-video got device registration: ' + JSON.stringify(result));
          });

          // Video endpoint announcement
          videoServer.on( "mjpeg-video.channel.announcement", function( camera, info )
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
              sourceAddress:      '',//info.addresses[0],
              //connectionType:     'socket.io'
              // connectionType:     'binaryJS'
              connectionType:     'socket.io_2'
            });
          });

          self.startCamera();
        }
      });
      
      
      // function(results){
      // if (results.length==0) return;
      
      // self.startCamera('/dev/' + results[0].device);
    }
  
};

mjpegvideo.prototype.startCamera = function startCamera(device){
  // var launch_options = ['node', '--debug-brk', require.resolve('mjpeg-video-server')];
  var launch_options = ['node', require.resolve('mjpeg-video-server')];
  launch_options.push('/dev/video0');
  // launch_options.push('-f');
  // launch_options.push('15');
  // launch_options.push('-u');
  // launch_options.push(':8090/?action=stream');
  // launch_options.push('-d');
  // launch_options.push('/dev/video1');
  var mock=false;
  if (process.env.MJPG_MOCK === 'true'){
    launch_options.push('-m');
    launch_options.push('true');
    launch_options.push('-u');
    launch_options.push(':8090/?action=stream');
  }

  // launch_options.push(device);

  const infinite=-1;
  var monitor = respawn(launch_options,{
      name: 'mjpegserver',
      maxRestarts: infinite,
      sleep: 1000
  })
  monitor.on('stdout', function(data){
      console.log('STDOUT:' + data.toString('utf-8'));
  })
  var self=this;
  monitor.on('stderr', function(data){
    var msg = data.toString('utf-8');
    var service;
    try {
      service = JSON.parse(msg);
    } catch (e) {
      return; //abort, not a json message
    }
    // if ('service' in service){
    //   self.deps.globalEventLoop.emit('CameraRegistration',{location:service.txtRecord.cameraLocation, videoMimeType:service.txtRecord.videoMimeType, resolution:service.txtRecord.resolution, framerate:service.txtRecord.framerate, relativeServiceUrl:service.txtRecord.relativeServiceUrl, connectionType:'http',sourcePort:service.port, sourceAddress:service.addresses[0]});
    // }
  })
  monitor.on('exit', function(){
      console.log("mjpeg-video-server exit");
  });
  monitor.on('crash', function(){
     console.log("mjpeg-video-server crash");
  });

  monitor.start();

}

//Export provides the public interface
module.exports = function (name, deps) {
  return new mjpegvideo(name,deps);
};
