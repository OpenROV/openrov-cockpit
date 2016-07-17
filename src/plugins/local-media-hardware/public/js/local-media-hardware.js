(function(window, document, $) { //The function wrapper prevents leaking variables to global space
  'use strict';


  //Hack to stop all media feeds
  var MediaStream = window.MediaStream;

  if (typeof MediaStream === 'undefined' && typeof webkitMediaStream !== 'undefined') {
    MediaStream = webkitMediaStream;
  }

  /*global MediaStream:true */
  if (typeof MediaStream !== 'undefined' && !('stop' in MediaStream.prototype)) {
    MediaStream.prototype.stop = function() {
      this.getAudioTracks().forEach(function(track) {
        track.stop();
      });

      this.getVideoTracks().forEach(function(track) {
        track.stop();
      });
    };
  }


  var LocalMedia;

  //These lines register the Example object in a plugin namespace that makes
  //referencing the plugin easier when debugging.
  var plugins = namespace('plugins');
  plugins.LocalMedia = LocalMedia;

  LocalMedia = function LocalMedia(cockpit) {

    console.log('Loading LocalMedia plugin in the browser.');

    //instance variables
    this.cockpit = cockpit;
    this.rov = cockpit.rov;
    this.settings = {};

    // for plugin management:
    this.Plugin_Meta = {
      name: 'LocalMedia Control', // for the settings
      viewName: 'LocalMedia Control plugin', // for the UI
      defaultEnabled: true
    };

    this.videoCapture = false;
    this.audioCapture = false;
    this.mediaRecorder = null;
    this.mediaStream = null;
    this.state = {capturing:false,muted:false};

    cockpit.emit('local-media-status',this.state);

  };

  //Adding the public methods using prototype simply groups those methods
  //together outside the parent function definition for easier readability.

  //Called by the plugin-manager to enable a plugin
  LocalMedia.prototype.enable = function enable() {
    this.startlisten();
  };

  //Called by the plugin-manager to disable a plugin
  LocalMedia.prototype.disable = function disable() {
    console.error('need to impliment disable in local-media-hardware');
  };

  //listen gets called by the plugin framework after all of the plugins
  //have loaded.
  LocalMedia.prototype.startlisten = function startlisten() {
    var self = this;

    this.cockpit.on('local-media-audio-start',function(){
      self.capture({audio: true});
    });

    this.cockpit.on('local-media-audio-stop',function(){
      self.stop();
    });

    this.cockpit.on('local-media-audio-mute',function(){
      var audioTracks = self.mediaStream.getAudioTracks();
      for (var i = 0, l = audioTracks.length; i < l; i++) {
        audioTracks[i].enabled = false;
      }
      self.state.muted=true;
      cockpit.emit('local-media-status',self.state);
    });

    this.cockpit.on('local-media-audio-unmute',function(){
      var audioTracks = self.mediaStream.getAudioTracks();
      for (var i = 0, l = audioTracks.length; i < l; i++) {
        audioTracks[i].enabled = true;
      }
      self.state.muted=false;
      cockpit.emit('local-media-status',self.state);
    });


  };

  LocalMedia.prototype.stop = function stop() {
    if (!this.mediaStream) {
      return;
    } //not capturing
    //this.mediaRecorder.stop();
    this.mediaStream.stop();
    this.mediaRecorder = null;
    this.mediaStream = null;
  };

  LocalMedia.prototype.capture = function capture(UserMediaOptions) {
    if (this.mediaStream) {
      return;
    }
    var self = this;
    var audioInitFrame = null;

    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
    navigator.getUserMedia(UserMediaOptions,
      function(stream) {
        var options = {
          audioBitsPerSecond: 128000,
          videoBitsPerSecond: 2500000,
          //                mimeType : 'video/mp4'
        }
        self.mediaStream = stream;
        var mediaRecorder = new MediaRecorder(stream, options);
        self.mediaRecorder = MediaRecorder;
        mediaRecorder.ondataavailable = function(e) {
          if ((audioInitFrame == null)||(audioInitFrame.size<1500)){
            if (audioInitFrame==null){
              audioInitFrame = e.data;
            }else {
              audioInitFrame=new Blob([audioInitFrame,e.data]);
            }
            console.log(audioInitFrame.size);
            if (audioInitFrame.size > 1500){
              cockpit.emit('local-media-init', audioInitFrame);
            }
          } else {
            cockpit.emit('local-media-data', e);
          }
        }
        mediaRecorder.onerror = function(err) {
          console.error('Errror in mediaRecording: ', err);
        }
        mediaRecorder.start(1000 / 30); //attempt on data events for each frame
        console.log("Recording as ", mediaRecorder.mimeType);
        self.state.capturing=true;
        cockpit.emit('local-media-status',self.state);
      }, //initializeRecorder,
      function(err) {
        console.error(err);
        self.state.capturing=false;
        cockpit.emit('local-media-status',self.state);
      });


  }

  window.Cockpit.plugins.push(LocalMedia);

}(window, document, $));
