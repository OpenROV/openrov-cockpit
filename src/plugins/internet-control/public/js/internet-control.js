(function(window, document, $) { //The function wrapper prevents leaking variables to global space
    'use strict';
    var IC;

    //These lines register the Example object in a plugin namespace that makes
    //referencing the plugin easier when debugging.
    var plugins = namespace('plugins');
    plugins.IC = IC;

    IC = function IC(cockpit) {

      console.log('Loading internet-control plugin in the browser.');

      //instance variables
      this.cockpit = cockpit;
      this.rov = cockpit.rov;
      this.settings = {};

      // for plugin management:
      this.pluginDefaults = {
        name: 'Internet Control', // for the settings
        viewName: 'Internet Control plugin', // for the UI
        canBeDisabled: true, //allow enable/disable
        defaultEnabled: false
      };
      this.enabled=false;
      this.connected = false;
      this.connecting = false;
      this.viewers = 0;
      this.peers = [];

    };

    //private functions and variables (hidden within the function, available via the closure)


    //Adding the public methods using prototype simply groups those methods
    //together outside the parent function definition for easier readability.

    //Called by the plugin-manager to enable a plugin
    IC.prototype.enable = function enable() {
      this.startlisten();
    };

    //Called by the plugin-manager to disable a plugin
    IC.prototype.disable = function disable() {
      //TODO: Impliment and unlisten
    };


    //listen gets called by the plugin framework after all of the plugins
    //have loaded.
    IC.prototype.startlisten = function startlisten() {
      if (!this.isEnabled){return;}
      var self = this;

      var statusUpdate=function(){
        var status = {status:'off',stats:{viewers:0,pilots:0,connection:{}},pilots:{}};
        if (self.connecting){
          status.status='starting';
        }
        if (self.connected){
          status.status='streaming';
        }
        status.stats.viewers = self.viewers;


        //TODO: Figure out how to show stats
        /*
        status.stats.connection = self.peers.map(function(item){
          item._pc.getStats(function(res){
            return res.result();
          });
        }).reduce(function(previousValue,currentValue){
          if (previousValue===null){
            return currentValue;
          }
          for (var property in currentValue) {
              if (object.hasOwnProperty(property)) {
                  previousValue[property]=previousValue[property]+currentValue[property];
              }
          }
          return previousValue;
        },null);

        */
        self.cockpit.emit('plugin-internetControl-status',status);
      }
      setInterval(statusUpdate,1000);

      //Response from the getSettings call. Using the withHistory will call the
      //update function with the last copy of this message that had been sent.
      //The settings manager sends a change message for each section when
      //first read in.
      this.rov.withHistory.on('settings-change.ic', function(settings) {
          console.log("Settings changed for IC");
          self.settings = settings.ic;

          //TODO: Move to a pattern that can retry the connection when the setting changes
          $.getScript(self.settings.webRTCSignalServerURI + "/msgpack.min.js");
          $.getScript(self.settings.webRTCSignalServerURI + "/components/simple-peer/simplepeer.min.js", function() {
              var _self = self
              var Peer = window.SimplePeer;
              var io = window.io;
              var socket = io(self.settings.webRTCSignalServerURI,{path:'/netcockpit-signal'});
              self.connecting = true;
              var peerOpts= {
                  channelConfig: {
                    ordered: false,
                    maxRetransmits: 0
                  }
                }


              var heartbeatInterval = null;
              socket.on('close',function(){
                if (heartbeatInterval!==null){
                  clearInterval(heartbeatInterval);
                }
                self.connected=false;
              });

              var connectionTimeOutTimer=null;
              socket.on('disconnect',function(){
                console.log("disconneted");
                self.connected = false;
              })

              socket.on('reconnect',function(){
                console.log("disconneted");
                self.connected = true;
              })

              socket.on('heartbeat',function(data){
                console.log('Heartbeat: ' + JSON.stringify(data));
              });

              socket.on('connect',function(){
                self.connected = true;
                self.connecting= false;


                //var msgpack = require("msgpack-lite");

                heartbeatInterval=setInterval(function(){
                  if (!self.connected){return;}
                  socket.emit('heartbeat','server');
                },1000);
                var pilot_sender_id = null;

                socket.on('peer-connect-offer',function(peer_id,callback){
                  var p = new Peer(peerOpts);

                  p.withHistory = {
                    on: function(event, fn) {
                      p.on(event, fn);
                    }
                  };

                  p.on('error', function (err) {
                    console.error('error', err)
                  })

                  p.on('signal', function (data) {
                    socket.emit('signal',peer_id, data);
                    console.log('SIGNAL SENT:', JSON.stringify(data))
                  })

                  var onSignalHanlder = function(data,sender_id){
                    if (sender_id !== peer_id){
                      console.error('Invalid sender_id');
                      return;
                    }
                    p.signal(data);
                  };

                  socket.on('signal',onSignalHanlder);

                  callback(true);

                  p.on('connect', function(){
                    _self.viewers++;
                    _self.peers.push(p);
                    //make last person to connect pilot by default
                    pilot_sender_id = peer_id;
                    _self.cockpit.emit('plugin.rovpilot.sendToROVEnabled',false);
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

                        if (p==null) {return;}
                        args = args.filter(function(n){ return n != null });
                        p.sendemit.apply(this,args);
                    };

                    var onAnyHandler = function() {
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
                    }
                    _self.rov.onAny(onAnyHandler);

                    //Since the video comes in via a different route...
                    const webRTCDataChannelChunkLimit=16*1024; //16KB Chunk Recommendation
                    var videodataHanlder = function(data){
                      var chunk_count = 1;
                      var sliceend=0;
                      var end = 0;
                      while(end<data.byteLength){
                        var sliceend = sliceend+webRTCDataChannelChunkLimit>data.byteLength?data.byteLength:sliceend+webRTCDataChannelChunkLimit
                        var chunk = data.slice(end,sliceend);
                        p.sendemit('x-h264-video.chunk',chunk_count,data.byteLength-sliceend,chunk);
                        chunk_count++;
                        end=sliceend;
                      }
                    }
                    _self.cockpit.on('x-h264-video.data',videodataHanlder);

                    p.on('data',function(data){
                      var msg = msgpack.decode(data);
                      switch(msg[0]){
                        case 'request_Init_Segment':
                          _self.cockpit.emit('request_Init_Segment',function(init){
                              p.sendemit('x-h264-video.init',init);
                          });
                        break;
                      }

                      if (peer_id == pilot_sender_id){
                        switch(msg[0]){
                          case 'throttle':
                          case 'yaw':
                          case 'list':
                          case 'pitch':
                          case 'roll':
                          case 'strafe':
                            _self.rov.emit(msg[0],msg[1]);
                          break;
                          case 'plugin.rovpilot.desiredControlRates':
                          case 'plugin.externalLights.toggle':
                          case 'plugin.externalLights.adjust':
                          case 'plugin.externalLights.set':
                          case 'plugin.laser.set':
                          case 'plugin.lights.toggle':
                          case 'plugin.lights.adjust':
                          case 'plugin.lights.set':
                          case 'plugin.rovpilot.depthHold.set':
                          case 'plugin.rovpilot.headingHold.set':
                            _self.rov.emit.apply(_self.rov,msg);
                          break;
                        }
                      }

                    });

                  p.on('close', function(){
                    _self.viewers--;
                    socket.off('signal',onSignalHanlder);
                    _self.rov.offAny(onAnyHandler);
                    _self.cockpit.off('x-h264-video.data',videodataHanlder);
                    _self.cockpit.emit('plugin.rovpilot.sendToROVEnabled',true);
                    var index = _self.peers.indexOf(p);
                    if (index > -1) {
                      _self.peers.splice(index, 1);
                    }
                    p = null;
                  });



                })
              });

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
