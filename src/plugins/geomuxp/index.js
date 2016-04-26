const exec=require('child_process').exec;
const fs=require('fs');
const respawn = require('respawn');

var geomux = function geomux(name, deps) {
  console.log('The geo-mux plugin.');

  //state variables
  this.deps = deps;
  var self=this;
  this.services={};

}


geomux.prototype.start = function start(){
  var geoprogram = '';
  if (process.env.GEO_MOCK == 'true'){
    geoprogram = require.resolve('geo-video-simulator');
  }
  else {
    try {
      geoprogram =require.resolve('geo-video-server')
    } catch (er) {
      console.log(process.env.GEO_MOCK);
      console.log("geo-video-server not installed")
      return;
    }
  }

  var launch_options = ['nice','-1','node',geoprogram];

  const infinite=-1;
  var monitor = respawn(launch_options,{
      name: 'geomux',
      maxRestarts: infinite,
      sleep: 1000
  })

  var self = this;

  monitor.on('stderr',function(data){
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

  });

  monitor.start();

};

//Export provides the public interface
module.exports = function (name, deps) {
  return new geomux(name,deps);
};
