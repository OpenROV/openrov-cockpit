const exec=require('child_process').exec;
const mdns=require('mdns');
const fs=require('fs');
var geomux = function geomux(name, deps) {
  console.log('The geo-mux plugin.');

  //state variables
  this.deps = deps;
  var self=this;
  this.services={};
 
}

geomux.prototype.geomuxInstalled = function geomuxInstalled(callback){
    var child = exec('dpkg -l', function(err, stdout, stderr) {
        if (err) throw err;
        var result = false;
        if (stdout.indexOf('geomux')>0){
            result = true;
        }
        callback(result);
    });
}

geomux.prototype.installGeoMux = function installGeoMux(callback){
    var child = exec('apt-get update && apt-get install -y geomux', function(err,stdout,stderr){
        if (err) throw err;
        callback();
    });
}

var mdnsBrowser;
geomux.prototype.startBrowser = function startBrowser(){
    console.log("geomux.prototype.startBrowser")
    var self = this;
    var sequence = [
        mdns.rst.DNSServiceResolve(),
        'DNSServiceGetAddrInfo' in mdns.dns_sd ? mdns.rst.DNSServiceGetAddrInfo() : mdns.rst.getaddrinfo({families:[4]}),
        mdns.rst.makeAddressesUnique()
    ];    
    var mdnsBrowser = mdns.createBrowser((mdns.tcp('geomux')),{resolverSequence: sequence, networkInterface: 'dummy0'});
    
    mdnsBrowser.on('serviceUp', function(service) {
      console.log("geomux.prototype.startBrowser:serviceUp");
      self.services[service.fullname + ":" + service.port]=service;
      //TODO: Update the mDNS publish to include all the camera details
      self.deps.rov.emit('CameraRegistration',{location:'front', videoMimeType:'video/mp4', resolution:'1920x1080', framerate:30, sourcePort:service.port, sourceAddress:service.addresses[0]});
      console.log("Sent Camera Registration");
    });
    mdnsBrowser.on('serviceDown', function(service) {
      delete this.services[service.fullname + ":" + service.port];
    });
    
    mdnsBrowser.start();   
    console.dir(mdns.browseThemAll());
    console.log("geomux.prototype.startBrowser COMPLETE")
};

geomux.prototype.start = function start(){
    this.startBrowser();
};

//Export provides the public interface
module.exports = function (name, deps) {
  return new geomux(name,deps);
};
