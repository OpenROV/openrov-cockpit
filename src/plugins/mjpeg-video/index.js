const exec=require('child_process').exec;
const mdns=require('mdns');
const fs=require('fs');
const respawn = require('respawn');
var mjpegvideo = function mjpegvideo(name, deps) {
  console.log('The mjpeg-video plugin.');

  //state variables
  this.deps = deps;
  var self=this;
  this.services={};

}

var mdnsBrowser;
mjpegvideo.prototype.startBrowser = function startBrowser(){
    var self = this;
    var sequence = [
        mdns.rst.DNSServiceResolve(),
        'DNSServiceGetAddrInfo' in mdns.dns_sd ? mdns.rst.DNSServiceGetAddrInfo() : mdns.rst.getaddrinfo({families:[4]}),
        mdns.rst.makeAddressesUnique()
    ];
    var mdnsOptions = {resolverSequence: sequence};
    if (this.deps.config.preferences.get('serviceDiscoveryNIC')){
      mdnsOptions.networkInterface=this.deps.config.preferences.get('serviceDiscoveryNIC');
    }
    var mdnsBrowser = mdns.createBrowser((mdns.tcp('mjpeg-video')),mdnsOptions);

    mdnsBrowser.on('serviceUp', function(service) {
      console.log("Serice UP MJPG");
      console.dir(service);
      self.services[service.fullname + ":" + service.port]=service;
      //TODO: Update the mDNS publish to include all the camera details
      self.deps.rov.emit('CameraRegistration',{location:service.txtRecord.cameraLocation, videoMimeType:service.txtRecord.videoMimeType, resolution:service.txtRecord.resolution, framerate:service.txtRecord.framerate, relativeServiceUrl:service.txtRecord.relativeServiceUrl, sourcePort:service.port, sourceAddress:service.addresses[0]});
    });

    mdnsBrowser.on('serviceDown', function(service) {
      Console.log("Service Down");
      console.dir(service);
      //delete this.services[service.fullname + ":" + service.port];
    });

    mdnsBrowser.start();
    console.dir(mdns.browseThemAll());
};

mjpegvideo.prototype.start = function start(){

    var launch_options = ['node',require.resolve('mjpeg-video-server')];
    var mock=false;
    if (this.deps.config.preferences.get('USE_MOCK') === 'true'){
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
    monitor.on('stderr', function(data){
        console.log('STDERR:' + data.toString('utf-8'));
    })
    monitor.on('exit', function(){
       console.log("mjpeg-video-server exit");
    });
    monitor.on('crash', function(){
       console.log("mjpeg-video-server crash");
    });

    this.startBrowser();
    monitor.start();
};

//Export provides the public interface
module.exports = function (name, deps) {
  return new mjpegvideo(name,deps);
};
