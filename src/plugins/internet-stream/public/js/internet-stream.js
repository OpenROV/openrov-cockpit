//TODO: Replace the URL with the value returned in the profile
//TODO: Disable sreaming if not logged in with streaming enabled in the profile
//TODO: Change the API to request a streaming server from the request API via the URL in the profile
(function(window, document, $) { //The function wrapper prevents leaking variables to global space
  'use strict';

  var InternetStream;

  var log,log_trace;
  var lock;

  $.getScript("components/visionmedia-debug/dist/debug.js",function(){
    log = debug('internet-stream:unclassified');
    log_trace = debug('internet-stream:trace');
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
    this.Plugin_Meta = {
      name: 'Internet Streaming', // for the settings
      viewName: 'Internet Streaming plugin', // for the UI
      defaultEnabled: true
    };
    this.connected = false;
    this.connecting = false;
    this.streaming = false;
    this.loggedIn = false;
    this.enabled = false;
    var self=this;
    this.cockpit.withHistory.on('cloudprofile-status',function(status){
      self.loggedIn=status.loggedIn;
    });

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
  };

  InternetStream.prototype.startlisten = function startlisten(){
    var self = this;
    
    this.rov.withHistory.on('settings-change.internetstreaming', function(settings) {
      //sharing the internet server settings
      self.settings = settings.internetstreaming;
    });    
    
    this.cockpit.on('internet-stream-start',function(){
      if (!self.enabled){return;}
      self.startService();

    });

    this.cockpit.on('internet-stream-stop',function(){
      if (!self.enabled){return;}
      self.stopService();
      self.stop();
    });
  }

  InternetStream.prototype.stoplisten = function stoplisten(){
    if (this.streaming) {
      this.stop();
    }
  }


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
    this.cockpit.emit('internet-stream-status',{isStreaming:false,connecting:false,testmode:this.settings.testmode});

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

    self.cockpit.emit('internet-stream-status',{isStreaming:true,connecting:false,testmode:self.settings.testmode});

  }


  //listen gets called by the plugin framework after all of the plugins
  //have loaded.
  var socket = null;
  var closeHandler = null;
  var connectHandler = null;
  InternetStream.prototype.startService = function startService() {
    if (!this.isEnabled) {
      return;
    }

    //TODO: Move the stream setup to a function based on a switch
    if (!this.loggedIn){
      setTimeout(this.startlisten.bind(this),5000);
      return;
    };

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
    if (self.settings==null) {return;};
    
    
      socket = io(self.settings.streamingServerURI,{path:'/internetcomms','multiplex':false, query: 'token=' + localStorage.getItem('id_token')});
      self.cockpit.emit('internet-stream-status',{isStreaming:false,connecting:true,testmode:self.settings.testmode});
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
        socket.emit('broadcast-stream-on', {test:self.settings.testmode},function(ok) {
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
      socket.on('twitch-stream-status',function(stats){
        log_trace('twitch_stats',JSON.stringify(stats));
        self.cockpit.emit('twitch-stream-status',stats);
      })

  }

  InternetStream.prototype.stopService = function stopService() {
    socket.close();
    socket.off('close', closeHandler);
    socket.off('connect', connectHandler);
    this.cockpit.emit('internet-stream-status',{isStreaming:false,connecting:false,testmode:this.settings.testmode});   
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
