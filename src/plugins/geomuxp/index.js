const exec=require('child_process').exec;
const mdns=require('mdns');
const fs=require('fs');
const respawn = require('respawn');

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
    var mdnsOptions = {resolverSequence: sequence};
    if (this.deps.config.preferences.get('serviceDiscoveryNIC')){
      mdnsOptions.networkInterface=this.deps.config.preferences.get('serviceDiscoveryNIC');
    }
    mdnsBrowser = mdns.createBrowser((mdns.tcp('geomux')),mdnsOptions);
    //mdnsBrowser = mdns.createBrowser((mdns.tcp('geomux')),{networkInterface: 'dummy0'});

    //TODO: Find way to uniquely identify service when it goes down so we can remove it from the list
    //TODO: Why or why does the avahi service need to be restarted to work?
    mdnsBrowser.on('serviceUp', function(service) {
      console.log("geomux.prototype.startBrowser:serviceUp");
      self.services[service.fullname + ":" + service.port]=service;
      //TODO: Update the mDNS publish to include all the camera details
      self.deps.rov.emit('CameraRegistration',{location:service.txtRecord.cameraLocation, videoMimeType:service.txtRecord.videoMimeType, resolution:service.txtRecord.resolution, framerate:service.txtRecord.framerate, relativeServiceUrl:service.txtRecord.relativeServiceUrl, sourcePort:service.port, sourceAddress:service.addresses[0]});
      console.log("Sent Camera Registration");
    });
    mdnsBrowser.on('serviceDown', function(service) {
    // Breaks at the moment, fullname is not part of the serviceDown message
        console.log("Serice down mDNS message recieved");
        console.dir(service);
    //  delete this.services[service.fullname + ":" + service.port];
    });

    mdnsBrowser.start();
    console.dir(mdns.browseThemAll());
 //   self.deps.rov.emit('CameraRegistration',{location:'forward', videoMimeType:'video/mp4', sourcePort:'8099',relativeServiceUrl:null});
    console.log("geomux.prototype.startBrowser COMPLETE")
};

geomux.prototype.start = function start(){
  try {
    var test =require.resolve('geo-video-server')
  } catch (er) {
    console.log("geo-vide-server not installed")
    return;
  }

  var launch_options = [require.resolve('geo-video-server')];

  const infinite=-1;
  var monitor = respawn(launch_options,{
      name: 'geomux',
      maxRestarts: infinite,
      sleep: 1000
  })

  this.startBrowser();
  monitor.start();

};

//Export provides the public interface
module.exports = function (name, deps) {
  return new geomux(name,deps);
};
