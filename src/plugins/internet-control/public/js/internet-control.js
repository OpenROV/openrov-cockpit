(function(window, document, $) { //The function wrapper prevents leaking variables to global space
    'use strict';


    var IC;

    //These lines register the Example object in a plugin namespace that makes
    //referencing the plugin easier when debugging.
    var plugins = namespace('plugins');
    plugins.IC = IC;

    IC = function IC(cockpit) {

      console.log('Loading example plugin in the browser.');

      //instance variables
      this.cockpit = cockpit;
      this.rov = cockpit.rov;
      this.settings = {};

      // for plugin management:
      this.pluginDefaults = {
        name: 'Internet Control', // for the settings
        viewName: 'Internet Control plugin', // for the UI
        canBeDisabled: true, //allow enable/disable
        defaultEnabled: true
      };

    };

    //private functions and variables (hidden within the function, available via the closure)

    var _name = '';
    var getAttributes = function getAttributes() {
      return {
        name: _name
      }
    }

    //Adding the public methods using prototype simply groups those methods
    //together outside the parent function definition for easier readability.

    //Called by the plugin-manager to enable a plugin
    IC.prototype.enable = function enable() {
      alert('Internet-control enabled');
    };

    //Called by the plugin-manager to disable a plugin
    IC.prototype.disable = function disable() {
      alert('Internet-control disabled');
    };


    //listen gets called by the plugin framework after all of the plugins
    //have loaded.
    IC.prototype.listen = function listen() {
      var self = this;

      //Response from the getSettings call. Using the withHistory will call the
      //update function with the last copy of this message that had been sent.
      //The settings manager sends a change message for each section when
      //first read in.
      this.rov.withHistory.on('settings-change.ic', function(settings) {
          console.log("Settings changed for IC");
          self.settings = settings.ic;



          //TODO: Move to a pattern that can retry the connection when the setting changes
          //$.getScript(self.settings.webRTCSignalServerURI + "/simplepeer.min.js", function() {
          $.getScript(self.settings.webRTCSignalServerURI + "/msgpack.min.js");
          $.getScript(self.settings.webRTCSignalServerURI + "/simplepeer.js", function() {
              var _self = self
              var Peer = window.SimplePeer;
              var io = window.io;
              var socket = io(self.settings.webRTCSignalServerURI);

              var opts = {
//                peerOpts: {
//                  channelConfig: {
//                    ordered: false,
//                    maxRetransmits: 0
//                  }
//                },
                autoUpgrade: false
              }

              var heartbeatInterval = null;
              socket.on('close',function(){
                if (heartbeatInterval!==null){
                  clearInterval(heartbeatInterval);
                }
              });

              socket.on('heartbeat',function(data){
                console.log('Heartbeat: ' + data);
              });

              socket.on('connect',function(){
                //var msgpack = require("msgpack-lite");

                heartbeatInterval=setInterval(function(){
                  socket.emit('heartbeat','server');
                },1000);

                socket.on('peer-connect-offer',function(peer_id,callback){
                  var p = new Peer();

                  p.withHistory = {
                    on: function(event, fn) {
                      p.on(event, fn);
                    }
                  };

                  p.on('error', function (err) { console.log('error', err) })

                  p.on('signal', function (data) {
                    socket.emit('signal',peer_id, data);
                    console.log('SIGNAL SENT:', JSON.stringify(data))
                  })

                  socket.on('signal',function(data,sender_id){
                    if (sender_id !== peer_id){
                      console.error('Invalid sender_id');
                      return;
                    }
                    p.signal(data);
                  });

                  callback(true);

                  p.on('connect', function(){
//                    var emitter = new EventEmitter2();
                    p.sendemit = function sendemit(){
                      var args = new Array(arguments.length);
                      for(var i = 0; i < args.length; ++i) {
                                  //i is always valid index in the arguments object
                          args[i] = arguments[i];
                      }
                      p.send(msgpack.encode(args));
                      //p.send("THIS IS A STRING!!!!");
                    }

                    //Test data payload sizes
                    for (var i=1;i<=10;i++){
                      var size = Math.pow(2,i);
                      p.sendemit('data-msg',size,new ArrayBuffer(size),'ok');
                    }

                    var onevent = _self.rov.socket.onevent;
                    _self.rov.socket.onevent = function (packet) {
                        var args = packet.data || [];
                        onevent.call (this, packet);    // original call
                      //  emit.apply   (this, ["*"].concat(args));      // additional call to catch-all
                        args = args.filter(function(n){ return n != null });
                        p.sendemit.apply(this,args);
                    };

                    _self.rov.onAny(function() {
                      var event = this.event;
                      if (event !== 'newListener') {
                      //  console.log(event);
                        var args = new Array(arguments.length);
                        for(var i = 0; i < args.length; ++i) {
                                    //i is always valid index in the arguments object
                            args[i] = arguments[i];
                        }
                        args.unshift(event);
                        p.sendemit.apply(p,args);
                      }
                    });

                    //Since the video comes in via a different route...
                    _self.cockpit.on('x-h264-video.data',function(data){
                      p.sendemit('x-h264-video.data',data);
                    });

                    p.on('data',function(data){
                      var msg = msgpack.decode(data);
                      switch(msg[0]){
                        case 'request_Init_Segment':
                          _self.cockpit.emit('request_Init_Segment',function(init){
                              p.sendemit('x-h264-video.init',init);
                          });
                        break;
                      }

                    });


                  })



                })
              });

          });


      });
    }

      IC.prototype.inputDefaults = function inputDefaults() {
        var self = this;
        return []
      };

      //headsUpMenuItems is called by the headsup-menu plugin if present.
      IC.prototype.altMenuDefaults = function altMenuDefaults() {
        //TODO: Need to cleanup the interface to the alt-menu
        var self = this;
        var item = {
          label: 'Internet Control',
          callback: function() {
            console.log("Internet Control")
          }
        };
        return item;
      }

      window.Cockpit.plugins.push(IC);

    }(window, document, $));
