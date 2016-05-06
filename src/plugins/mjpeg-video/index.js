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


mjpegvideo.prototype.enumerateDevices = function enumerateDevices(callback){
  var results=[];
  var i=0;
  fs.readdir('/dev', function (err, files) {
    if (err) {
      reject(err);
    }
    files.filter(function(file){
        return file.indexOf('video') == 0;
    }).forEach(function(file){
      //udevadm info --query=all --name=/dev/' + file
      //
      i++;
      exec('v4l2-ctl --list-formats -d /dev/' + file + ' | grep -q MJPEG', function(error, stdout, stderr){
        if (error == null){
          var result = {device: file, format:'MJPEG'}
          exec('udevadm info --query=all --name=/dev/' + file + ' | grep "S: v4l/by-id/"', function(error, stdout, stderr){
            i--;
            if (error == null){
                result.deviceid = stdout.slice("S: v4l/by-id/".length);
            }
            results.push(result);
            if(i==0){callback(results)};
          });

        } else {
          i--;
          if(i==0){callback(results)};
        }
      });
    });
  });
}

mjpegvideo.prototype.start = function start(){
  var self = this;
  //if (config.preferences.video)
  if (process.env.MJPG_MOCK === 'true'){
      self.startCamera('/dev/video0');
  } else {
    this.enumerateDevices(function(results){
      if (results.length==0) return;
      self.deps.rov.emit('video-deviceRegistration',results);
      self.startCamera('/dev/' + results[0].device);
    })
  }


};

mjpegvideo.prototype.startCamera = function startCamera(device){
  var launch_options = ['node',require.resolve('mjpeg-video-server')];
  var mock=false;
  if (process.env.MJPG_MOCK === 'true'){
    launch_options.push('-m');
    launch_options.push('true');
    launch_options.push('-u');
    launch_options.push(':8090/?action=stream');
  }


  launch_options.push(device);

  const infinite=-1;
  var monitor = respawn(launch_options,{
      name: 'mjpegserver',
      maxRestarts: infinite,
      sleep: 1000
  })
  monitor.on('stdout', function(data){
      // console.log('STDOUT:' + data.toString('utf-8'));
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
      self.deps.globalEventLoop.emit('CameraRegistration',{location:service.txtRecord.cameraLocation, videoMimeType:service.txtRecord.videoMimeType, resolution:service.txtRecord.resolution, framerate:service.txtRecord.framerate, relativeServiceUrl:service.txtRecord.relativeServiceUrl, sourcePort:service.port, sourceAddress:service.addresses[0]});
    }
  })
  monitor.on('exit', function(){
  //    console.log("mjpeg-video-server exit");
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
