(function(window, document, $) { //The function wrapper prevents leaking variables to global space
  'use strict';

  var InternetStream;

  //These lines register the Example object in a plugin namespace that makes
  //referencing the plugin easier when debugging.
  var plugins = namespace('plugins');
  plugins.InternetStream = InternetStream;

  InternetStream = function InternetStream(cockpit) {

    console.log('Loading internet-stream plugin in the browser.');

    //instance variables
    this.cockpit = cockpit;
    this.rov = cockpit.rov;
    this.settings = {};

    // for plugin management:
    this.pluginDefaults = {
      name: 'Internet Streaming', // for the settings
      viewName: 'Internet Streaming plugin', // for the UI
      canBeDisabled: true, //allow enable/disable
      defaultEnabled: true
    };
    this.enabled = false;
    this.connected = false;
    this.connecting = false;
    this.streaming = false;

  };
  //Private variables
  var audiodataHandler = null;
  var h264dataHandler = null;

  //Adding the public methods using prototype simply groups those methods
  //together outside the parent function definition for easier readability.

  //Called by the plugin-manager to enable a plugin
  InternetStream.prototype.enable = function enable() {
    if (this.enabled) {
      return;
    }
    this.enabled = true;
    this.listen();
    alert('Internet-streaming enabled');
  };

  //Called by the plugin-manager to disable a plugin
  InternetStream.prototype.disable = function disable() {
    if (!this.enabled) {
      return;
    }
    this.stoplistening();
    if (this.streaming) {
      this.stop();
    }
    alert('Internet-streaming disabled');
  };

  InternetStream.prototype.stop = function stop() {
    if (!this.streaming) {
      return;
    }
    //TODO: The off is getting lost somewhere and not registering with the eventEmitter2.
    this.cockpit.off('local-media-data', audiodataHandler);
    this.cockpit.off('x-h264-video.data', h264dataHandler)
    this.streaming = false;
  }

  InternetStream.prototype.stream = function stream() {
    var self=this;
    if (this.streaming) {
      return;
    }
    h264dataHandler = function(data) {
      if (!self.connected) {
        return;
      }
      socket.compress(false).emit('broadcast-stream-data', {
        type: 'video',
        payload: data
      });
    };

    audiodataHandler = function(data) {
      if (!self.connected) {
        return;
      }
      socket.compress(false).emit('broadcast-stream-data', {
        type: 'audio',
        payload: data.data
      });
    }

    self.cockpit.emit('request_Init_Segment', function(init) {
      h264dataHandler(init);
      //TODO: Verify this works, could end up with audio blocked because
      //user does not grant access to the mike.
      self.cockpit.on('local-media-data', audiodataHandler);
      self.cockpit.on('x-h264-video.data', h264dataHandler)
      self.streaming = true;
    });

  }


  //listen gets called by the plugin framework after all of the plugins
  //have loaded.
  var socket = null;

  InternetStream.prototype.listen = function listen() {
    if (!this.enabled) {
      return;
    }
    var closeHandler = function() {
      self.connected = false;
    }

    var connectHandler = function() {
      self.connected = true;
      self.connecting = false;
      //TODO: Add logic to restart an existing streaming session if one existed prior
    }

    var self = this;
    this.rov.withHistory.on('settings-change.ic', function(settings) {
      //sharing the internet server settings
      self.settings = settings.ic;
      socket = io(self.settings.webRTCSignalServerURI);
      self.connecting = true;
      socket.on('close', closeHandler);
      socket.on('connect', connectHandler);
      socket.on('reconnecting', function(number){
        if ((number>10)&&(self.streaming)){
          self.stop();
        }
      });
      socket.on('disconnect', function(){
        self.connected = false;
      });
      socket.on('reconnect', connectHandler);
      socket.on('broadcast-available', function(){
        socket.emit('broadcast-stream-on', function(ok) {
          self.stream();
        });
      })
      socket.on('broadcast-stream-closed', function() {
        self.stop();
      });

    });

  }

  InternetStream.prototype.stoplistening = function stoplistening() {
    socket.close();
    socket.off('close', closeHandler);
    socket.off('connect', connectHandler);
  }

  InternetStream.prototype.inputDefaults = function inputDefaults() {
    var self = this;
    return []
  };

  //headsUpMenuItems is called by the headsup-menu plugin if present.
  InternetStream.prototype.altMenuDefaults = function altMenuDefaults() {
    //TODO: Need to cleanup the interface to the alt-menu
    var self = this;
    var item = {
      label: 'Internet Streaming',
      callback: function() {
        console.log("Internet Streaming")
      }
    };
    return item;
  }

  window.Cockpit.plugins.push(InternetStream);

}(window, document, $));
