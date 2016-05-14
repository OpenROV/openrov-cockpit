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

  var ResloveURL = function(canidateURL){
    var http = location.protocol;
    var slashes = http.concat("//");
    var host = slashes.concat(window.location.hostname);

    if (canidateURL.startsWith(':')){
      //append host to rest of url that includes a new port
      return host.concat(canidateURL);
    }

    if (canidateURL.startsWith('http')){
      //use the URL as is
      return canidateURL;
    }

    //we have a relative or absolute URL to the existing host+port
    if ((window.location.port!='80') && (window.location.port!='443') && (window.location.port!='')){
      host.concat(":"+window.location.port);
    }
    return host.concat(canidateURL);
  }
  //listen gets called by the plugin framework after all of the plugins
  //have loaded.
  Video.prototype.listen = function listen() {
    var self=this;

    this.cockpit.on("plugin.video.video-clicked",function(){
      alert('Video plugin.\nThere will be a message sent to the ROV in 5 seconds.');
      setTimeout(function() {
        cockpit.rov.emit('plugin.video.foo');
      }, 5000);
    });

    //If the data comes down the pre-existing rov channel, we just need to forward
    //the traffic
    var dataflowing = false;
    this.rov.on('x-h264-video.data',function(data){
      self.cockpit.emit('x-h264-video.data',data);
      if (!dataflowing){
        self.cockpit.on('request_Init_Segment',function(fn){
          var handler = function(data){
            fn(data);
            self.rov.off('x-h264-video.init',handler);
          };
          self.rov.on('x-h264-video.init',handler);
          self.rov.emit('request_Init_Segment');
        });
        dataflowing = true;
      }

    });



    //If we get a CameraRegistration then we have to open a connection to the camera server
    //so that we can forward traffic to the cockpit emitter.
    //TODO: refactor like a crazy. This might only work with interent control because
    //the code below will *never* connect and thus be idle.  We really need to make
    //this more explicit behavior.
    var lastCameraRegsitration = null;
    this.rov.withHistory.on('CameraRegistration',function(data){
      //TODO: More robust handling of duplicat CameraRegistration messages.  If the Camera
      //already is setup, we want to ignore.  But we also want to handle multiple Cameras
      //and camera's that change settings.
      if ((lastCameraRegsitration !== null) &&(data.relativeServiceUrl == lastCameraRegsitration.relativeServiceUrl)){
        return;
      }
      lastCameraRegsitration = data;
      if (dataflowing){
          self.cockpit.emit('CameraRegistration',data);
      }

      data.sourceAddress = ResloveURL(data.relativeServiceUrl);

      if (data.videoMimeType=='video/mp4'){
        //We expect the mp4 data stream to be sent via a dedicated socket.io stream
        var connection = window.io.connect(data.sourceAddress,{path:data.wspath});
        connection.on("connect",function(){

          //TODO: abstract the messages enough that we can have multiple cameras controls
          self.cockpit.on('request_Init_Segment',function(fn){
            connection.emit('request_Init_Segment',function(data){
              fn(data);
            });
          });

          connection.on('x-h264-video.data',function(data){
            self.cockpit.emit('x-h264-video.data',data);
          })

          self.cockpit.emit('CameraRegistration',data);
        });
      } else {
          self.cockpit.emit('CameraRegistration',data);
      }

    });

  };

  Video.prototype.inputDefaults = function inputDefaults(){
    var self = this;
    return [{
      name: 'video.keyBoardMapping',
      description: 'Video for keymapping.',
      defaults: { keyboard: 'alt+0', gamepad: 'X' },
      down: function() { console.log('0 down'); },
      up: function() { console.log('0 up'); },
      secondary: [
        {
          name: 'video.keyBoardMappingDepdent',
          dependency: 'video.keyBoardMapping',
          defaults: { keyboard: '9', gamepad: 'RB' },
          down: function() { console.log('####'); }
        }
      ]
    },
      {
        name: 'video.testMessage',
        description: 'another video',
        defaults: { keyboard: 'alt+T' },
        down: function() {
          showMessageFoo = true;
          showMessageBar = true;
          self.cockpit.rov.emit('plugin.video.video_to_foo', 'abc'); }
      }]
  };

  window.Cockpit.plugins.push(Video);

}(window, document, $));
