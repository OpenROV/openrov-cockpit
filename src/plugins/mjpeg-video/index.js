const exec=require('child_process').exec;
const fs=require('fs');
const respawn = require('respawn');
var mjpegvideo = function mjpegvideo(name, deps) {
  console.log('The mjpeg-video plugin.');

  //state variables
  this.deps = deps;
  var self=this;
  this.services={};

}


mjpegvideo.prototype.start = function start(){

    var launch_options = ['node',require.resolve('mjpeg-video-server')];
    var mock=false;
    if (process.env.MJPG_MOCK === 'true'){
      launch_options.push('-m');
      launch_options.push('true');
      launch_options.push('-u');
      launch_options.push(':8090/?action=stream');
    }



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
      if ('service' in service){
        self.deps.rov.emit('CameraRegistration',{location:service.txtRecord.cameraLocation, videoMimeType:service.txtRecord.videoMimeType, resolution:service.txtRecord.resolution, framerate:service.txtRecord.framerate, relativeServiceUrl:service.txtRecord.relativeServiceUrl, sourcePort:service.port, sourceAddress:service.addresses[0]});
      }
    })
    monitor.on('exit', function(){
       console.log("mjpeg-video-server exit");
    });
    monitor.on('crash', function(){
       console.log("mjpeg-video-server crash");
    });

    monitor.start();
};

//Export provides the public interface
module.exports = function (name, deps) {
  return new mjpegvideo(name,deps);
};
