(function(window, document, $) { //The function wrapper prevents leaking variables to global space
  'use strict';

  var InternetStream;

  var log,log_trace;
  var lock;

  $.getScript("components/visionmedia-debug/dist/debug.js",function(){
    log = debug('internet-stream:unclassified');
    log_trace = debug('internet-stream:trace');
  });

  //<!-- Auth0Lock script -->
  $.getScript("//cdn.auth0.com/js/lock-9.1.min.js",function(){
    lock = new Auth0Lock('VeVsaT3dNLVt1Kv5xIx8GgW69mommmvQ', 'openrov.auth0.com');
  });

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
    this.startlisten();
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
  };

  InternetStream.prototype.stop = function stop() {
    log_trace('InternetStream:Stop');
    if (!this.streaming) {
      return;
    }
    //TODO: The off is getting lost somewhere and not registering with the eventEmitter2.
    this.cockpit.off('local-media-data', audiodataHandler);
    this.cockpit.off('x-h264-video.data', h264dataHandler);
    this.cockpit.emit('local-media-audio-stop');
    this.streaming = false;
  }

  InternetStream.prototype.stream = function stream() {
    log_trace('InternetStream:Stream');
    var self=this;
    if (this.streaming) {
      this.stop();
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
      self.cockpit.once('local-media-init', function(initaudio) {
        socket.compress(false).emit('broadcast-stream-init', {video:init,audio:initaudio}, function(){
          log_trace('received broadcast-stream-init callback');
          self.cockpit.on('local-media-data', audiodataHandler);
          self.cockpit.on('x-h264-video.data', h264dataHandler);
          self.streaming = true;
        });
        //TODO: Verify this works, could end up with audio blocked because
        //user does not grant access to the mike.
      });
      self.cockpit.emit('local-media-audio-start');
    });

  }


  //listen gets called by the plugin framework after all of the plugins
  //have loaded.
  var socket = null;
  var closeHandler = null;
  var connectHandler = null;
  InternetStream.prototype.startlisten = function startlisten() {
    if (!this.isEnabled) {
      return;
    }

    if (lock==null){
      setTimeout(this.startlisten.bind(this),500);
      return;
    }

    if (localStorage.getItem('id_token')==null){
      lock.show({ authParams: { scope: 'openid profile' } },function (err, profile, token) {
        if (err){
          console.alert('Error logging in:', JSON.stringify(err));
          return; //TODO: Better handling of canceling
        }
        localStorage.setItem('id_token', token);
        console.log(JSON.stringify(profile));
        this.startlisten.bind(this);
      });
      return;
    }

    closeHandler = function() {
      log_trace("socket.io connection closed");
      self.connected = false;
    }

    connectHandler = function() {
      log_trace("socket.io connected to streaming server");
      if (self.connected){
        //Okay, a new connection, need to restart data
        self.stop();
      }
      self.connected = true;
      self.connecting = false;
      //TODO: Add logic to restart an existing streaming session if one existed prior
    }

    var self = this;
    this.rov.withHistory.on('settings-change.internetstreaming', function(settings) {
      //sharing the internet server settings
      self.settings = settings.internetstreaming;
      socket = io(self.settings.streamingServerURI,{path:'/internetcomms','multiplex':false, query: 'token=' + localStorage.getItem('id_token')});

      socket.on("error", function(error) {
        if (error.type == "UnauthorizedError" || error.code == "invalid_token") {
          // redirect user to login page perhaps?
          console.log("User's token has expired");
        }
      });
      self.connecting = true;
      socket.on('close', closeHandler);
      socket.on('connect', connectHandler);
      socket.on('reconnecting', function(number){
        log_trace('socket.io reconenct');
        if ((number>10)&&(self.streaming)){
          self.stop();
        }
      });
      socket.on('disconnect', function(){
        log_trace('socket.io disconnect');
        self.connected = false;
      });
      socket.on('reconnect', connectHandler);
      socket.on('broadcast-available', function(){
        log_trace('broadcast-stream-available');
        if(self.streaming){
          self.stop();
        }
        log_trace('emitting broadcast-stream-on');
        socket.emit('broadcast-stream-on', {test:true},function(ok) {
          log_trace('received broadcast-stream-on');
          self.stream();

        });
      })
      socket.on('broadcast-stream-closed', function(reason) {
        log_trace('broadcast-stream-closed');
        log_trace('reason:' ,reason);
        self.stop();

      });
      socket.on('broadcast-stats',function(stats){
        log_trace('broadcast_stats',JSON.stringify(stats));
        self.cockpit.emit('broadcast-stats',stats);
      })

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
