(function (window, document, jQuery) { //The function wrapper prevents leaking variables to global space
  'use strict';


  var Video;

  //These lines register the Video object in a plugin namespace that makes
  //referencing the plugin easier when debugging.
  var plugins = namespace('plugins');
  plugins.Video = Video;

  Video = function Video(cockpit) {

    console.log('Loading video plugin in the browser.');

    //instance variables
    this.cockpit = cockpit;
    this.rov = cockpit.rov;

    // for plugin management:
    this.pluginDefaults = {
      name : 'video',   // for the settings
      viewName : 'Video plugin', // for the UI
      canBeDisabled : false, //allow enable/disable
      defaultEnabled: true
   };

  };



  var ResolveURL = function(canidateURL){
    var http = location.protocol;
    var slashes = http.concat("//");
    var host = slashes.concat(window.location.hostname);

    //just return fully qualifed addresses
    if (canidateURL.startsWith('http')){
        //use the URL as is
        return canidateURL;
    }

    //if a port is defined, use it
    if (canidateURL.startsWith(':')){
      //append host to rest of url that includes a new port
      return host.concat(canidateURL);
    } else {
      //we have a relative or absolute URL to the existing host+port
      if ((window.location.port!='') && (window.location.port!='443') && (window.location.port!='80')){
        host.concat(":"+window.location.port);
      }
    }
    return host.concat(canidateURL);
  }
  //listen gets called by the plugin framework after all of the plugins
  //have loaded.
  Video.prototype.listen = function listen() {
    var self=this;
 
    var CameraRegsitrations = {};
    this.rov.withHistory.on('CameraRegistration',function(data){
      //TODO: More robust handling of duplicat CameraRegistration messages.  If the Camera
      //already is setup, we want to ignore.  But we also want to handle multiple Cameras
      //and camera's that change settings.
      data.sourceAddress = ResolveURL(data.relativeServiceUrl);
      if (CameraRegsitrations[data.sourceAddress]){
        return;
      }
      CameraRegsitrations[data.sourceAddress] = true;

      switch(data.connectionType){
        case 'http': //pass on to MJPEG player that will connect over http
          data.sourceAddress = ResolveURL(data.relativeServiceUrl);
          self.cockpit.emit('CameraRegistration',data);
          break;
        case 'socket.io': //create the connection and pass data to the cocpkit bus for processing
          var connection;
          data.sourceAddress = ResolveURL(data.relativeServiceUrl);
          connection = window.io.connect(data.sourceAddress ,{path:data.wspath} );
          var handleInit=function(fn){
              connection.emit('request_Init_Segment',function(data){
                fn(data);
              });
          };
          
          var handleData=function(data){
              self.cockpit.emit('x-h264-video.data',data);
          }
          
          
          var handleMjpegData=function(data){
              self.cockpit.emit('x-motion-jpeg.data',data);
          }
          
          //TODO: abstract the messages enough that we can have multiple cameras controls
          self.cockpit.on('request_Init_Segment',handleInit);
          connection.on('x-h264-video.data',handleData);        
          
          connection.on('x-motion-jpeg.data',handleMjpegData);        

          connection.on("connect",function(){
            console.log("connected to socket.io video server end point");
          });        
          self.cockpit.emit('CameraRegistration',data);
          break;
        case 'binaryJs':
          $.getScript('components/binaryjs/dist/binary.js',function(){
            var connection;
            data.sourceAddress = ResolveURL(data.relativeServiceUrl);
            var address = data.sourceAddress.replace('http', 'ws') + data.wspath;
            connection = BinaryClient(address); 

            var handle;
            handle = function() {
              connection.on('stream', function(stream, meta) {
                // console.log('STREAM');
                stream.on('data', function(data) {
                  
                  var now =Date.now();
                  var dif = Number(now) - Number(data.timestamp);
                  self.cockpit.emit('x-motion-jpeg.data',data.data);
                  //console.log(data.timestamp + ' ' + now + ' ' +  dif );
                  // console.log(dif );
                  if (dif >= 300) {
                    console.log('dropping connection and reconnect')
                    connection.close();
                    connection =    BinaryClient(address); 
                    connection.on('open', handle);

                  }
                } )
              })
            };

            connection.on('open', handle);
            data.sourceAddress = '';
            self.cockpit.emit('CameraRegistration',data);

          });
          

          // window.io.connect(data.sourceAddress ,{path:data.wspath} );
          break;


        case 'rov': //data is comming over the rov bus, just pass it on to the cockpit bus
          var dataflowing=false; //this wont work for multiple cameras.
          self.rov.on('x-h264-video.data',function(data){
            self.cockpit.emit('x-h264-video.data',data);
            if (!dataflowing){
              dataflowing=true; 
              self.cockpit.on('request_Init_Segment',function(fn){
                var handler = function(data){
                  fn(data);
                  self.rov.off('x-h264-video.init',handler);
                };
                self.rov.on('x-h264-video.init',handler);
                self.rov.emit('request_Init_Segment');
              });
            }
          });
          self.cockpit.emit('CameraRegistration',data); 
          break;          
        default:
          console.error('Unrecognized camera registration connectionType:',data.connectionType);
        }

    });

  };

  window.Cockpit.plugins.push(Video);

}(window, document, $));
