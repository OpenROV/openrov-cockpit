const exec=require('child_process').exec;
const mdns=require('mdns');
const fs=require('fs');
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
    var mdnsBrowser = mdns.createBrowser((mdns.tcp('mjpeg-video')),{resolverSequence: sequence, networkInterface: 'dummy0'});
    
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
    this.startBrowser();
};

//Export provides the public interface
module.exports = function (name, deps) {
  return new mjpegvideo(name,deps);
};
