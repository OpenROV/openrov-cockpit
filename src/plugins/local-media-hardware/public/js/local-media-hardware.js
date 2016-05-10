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
    this.pluginDefaults = {
      name: 'LocalMedia Control', // for the settings
      viewName: 'LocalMedia Control plugin', // for the UI
      canBeDisabled: true, //allow enable/disable
      defaultEnabled: true
    };

    this.videoCapture = false;
    this.audioCapture = false;
    this.mediaRecorder = null;
    this.mediaStream = null;

    cockpit.emit('local-media-status',{capturing:false})

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

    if (this.cockpit.listeners('local-media-data').length>0) {
      self.capture({audio: true});
    }

    //We want to explicitly release the mediea resources if nothign is listening to twitchtv-stream-data
    this.cockpit.on('newListener',function(event){
      if (event == 'local-media-data'){
        self.capture({audio: true});
      }
    });

    this.cockpit.on('removeListener',function(event){
      if (event == 'local-media-data'){
        if (self.cockpit.listeners('local-media-data').length==0){
          self.stop();
        }
      }
    });

  };

  LocalMedia.prototype.stop = function stop() {
    if (!this.mediaStream) {
      return;
    } //not capturing
    this.mediaRecorder.stop();
    this.mediaStream.stop();
    this.mediaRecorder = null;
    this.mediaStream = null;
  };

  LocalMedia.prototype.capture = function capture(UserMediaOptions) {
    if (this.mediaStream) {
      return;
    }
    var self = this;


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
          cockpit.emit('local-media-data', e);
        }
        mediaRecorder.onerror = function(err) {
          console.error('Errror in mediaRecording: ', err);
        }
        mediaRecorder.start(1000 / 30); //attempt on data events for each frame
        console.log("Recording as ", mediaRecorder.mimeType);
        cockpit.emit('local-media-status',{capturing:true})
      }, //initializeRecorder,
      function(err) {
        console.error(err);
        cockpit.emit('local-media-status',{capturing:false})
      });


  }

  window.Cockpit.plugins.push(LocalMedia);

}(window, document, $));
