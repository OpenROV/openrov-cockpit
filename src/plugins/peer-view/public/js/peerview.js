(function(window, document, $) { //The function wrapper prevents leaking variables to global space
    'use strict';
    var PeerView;

    //These lines register the Example object in a plugin namespace that makes
    //referencing the plugin easier when debugging.
    var plugins = namespace('plugins');
    plugins.IC = PeerView;

    PeerView = function PeerView(cockpit) {

      console.log('Loading internet-control plugin in the browser.');

      //instance variables
      this.cockpit = cockpit;
      this.rov = cockpit.rov;
      this.settings = {};

      // for plugin management:
      this.pluginDefaults = {
        name: 'Peer View', // for the settings
        viewName: 'Peer Connect plugin', // for the UI
        canBeDisabled: true, //allow enable/disable
        defaultEnabled: true
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
    PeerView.prototype.enable = function enable() {
      this.startlisten();
    };

    //Called by the plugin-manager to disable a plugin
    PeerView.prototype.disable = function disable() {
      //TODO: Impliment and unlisten
    };


    //listen gets called by the plugin framework after all of the plugins
    //have loaded.
    PeerView.prototype.startlisten = function startlisten() {
      if (!this.isEnabled){return;}
      var self = this;
      if(window.cockpit.rov.connection!=='socket.io'){
        setTimeout(self.startlisten.bind(this),5000);
        return;
      }

      var statusUpdate=function(){
        var status = {status:'on',viewers:[],stats:{}};
        status.viewers = self.formatUsersMsg(self.peers);
        self.cockpit.emit('plugin-peerview-status',status);
        var pilot = self.peers.find(function(item){
          return item.rov_role == 'pilot';
        });
        if (pilot==null){
          self.cockpit.emit('plugin.rovpilot.sendToROVEnabled',true);
        } else {
          self.cockpit.emit('plugin.rovpilot.sendToROVEnabled',false);
        }
      }
      setInterval(statusUpdate,1000);
     
      self.cockpit.on('mc-promote',function(id,role){
        var peer = self.peers.find(function(item){
          return item.id = id;
        })
        if (peer !== null){          
          peer.rov_role=role;
          peer.sendemit('mc-assigned-role',role);
        }
      });      
      
      self.cockpit.on('mc-kick',function(id){
        var peer = self.peers.find(function(item){
          return item.id = id;
        })
        if (peer !== null){          
          peer.destroy();
        }
      });         

      //Response from the getSettings call. Using the withHistory will call the
      //update function with the last copy of this message that had been sent.
      //The settings manager sends a change message for each section when
      //first read in.

          //TODO: Move to a pattern that can retry the connection when the setting changes
          $.getScript("msgpack.min.js");
          $.getScript("simplepeer.min.js", function() {
              var _self = self
              var Peer = window.SimplePeer;
              var io = window.io;
              var socket = io(self.settings.webRTCSignalServerURI,{path:'/peerview'});
              self.connecting = true;
              var peerOpts= {
                  channelConfig: {
         //           ordered: false,
         //           maxRetransmits: 0
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
              //  console.log('Heartbeat: ' + JSON.stringify(data));
              });

              socket.on('connect',function(){
                self.connected = true;
                self.connecting= false;
                
                var buffer = [];
                
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
                    buffer.push(args);
                  }
                }
                _self.rov.onAny(onAnyHandler);
                
                var msgNumber = 0;
                var flushBuffer = function(){
                  while (buffer.length>0){
                //    console.log('flushing buffer...');
                    var args = buffer.shift();
                    var pack = msgpack.encode(args);
                     self.peers.forEach(function(p){
                     // p.sendemit.apply(p,args);         
                     p.sendPackedData(pack);           
                    });
                  }
                  setTimeout(flushBuffer.bind(this),20);
                }
                flushBuffer();

                //Since the video comes in via a different route...
                const webRTCDataChannelChunkLimit=16*1024; //16KB Chunk Recommendation
                var videodataHanlder = function(data){
                  var chunk_count = 1;
                  var sliceend=0;
                  var end = 0;
                  while(end<data.byteLength){
                    var sliceend = sliceend+webRTCDataChannelChunkLimit>data.byteLength?data.byteLength:sliceend+webRTCDataChannelChunkLimit
                    var chunk = data.slice(end,sliceend);
                    buffer.push(['x-h264-video.chunk',chunk_count,data.byteLength-sliceend,chunk]);
                    chunk_count++;
                    end=sliceend;
                  }
                }
                _self.cockpit.on('x-h264-video.data',videodataHanlder);
                

                //var msgpack = require("msgpack-lite");

                heartbeatInterval=setInterval(function(){
                  if (!self.connected){return;}
                  socket.emit('heartbeat','server');
                },5000);
                

                socket.on('peer-connect-offer',function(peer_id,callback){
                  console.log('got new peer connection offer from:',peer_id);
                  var p = new Peer(peerOpts);
                  p.peer_id = peer_id;

                  p.withHistory = {
                    on: function(event, fn) {
                      p.on(event, fn);
                    }
                  };

                  p.on('error', function (err) {
                    console.error('error', err)
                    socket.off('signal',onSignalHanlder);
                    p.destroy();              
                  })

                  p.on('signal', function (data) {
                    socket.emit('signal',peer_id, data);
                    console.log('SIGNAL SENT:', JSON.stringify(data))
                  })

                  var onSignalHanlder = function(data,sender_id){
                    if (sender_id !== peer_id){
                      console.error('Invalid sender_id: got %s instead of %s, ignoring...',sender_id,peer_id);
//                      socket.off('signal',onSignalHanlder);
//                      p.destroy();

                      return;
                    }
                    console.log('Got signal from %s for %s',sender_id,peer_id)
                    p.signal(data);
                  };

                  socket.on('signal',onSignalHanlder);

                  callback(true);

                  p.on('connect', function(){
                    _self.viewers++;
                    _self.peers.push(p);
                    _self.cockpit.emit('missionControl-users',_self.formatUsersMsg(_self.peers));
                    //make last person to connect pilot by default
                    //self.pilot_sender_id = peer_id;
                    //_self.cockpit.emit('plugin.rovpilot.sendToROVEnabled',false);

                    p.sendPackedData = function sendPackedData(data){
                      p.send(data);
                    };

                    p.sendemit = function sendemit(){
                      var args = new Array(arguments.length);
                      var pack = null;
                      for(var i = 0; i < args.length; ++i) {
                                  //i is always valid index in the arguments object
                          args[i] = arguments[i];
                      }
                      pack = msgpack.encode(args);
                      p.sendPackedData(pack);
                    }

                    //Test data payload sizes
                    for (var i=1;i<=10;i++){
                      var size = Math.pow(2,i);
                      p.sendemit('data-msg',size,new ArrayBuffer(size),'ok');
                    }

                    p.on('data',function(data){
                      var msg = msgpack.decode(data);
                      switch(msg[0]){
                        case 'request_Init_Segment':
                          _self.cockpit.emit('request_Init_Segment',function(init){
                              p.sendemit('x-h264-video.init',init);
                          });
                        break;
                        case 'mission-control-register':
                          p.userName = msg[1];
                        break;
                      }
                      
                      //co-pilot
                      var copilot_blacklist = [
                        'plugin.rovpilot.desiredControlRates',
                        'ping'
                      ];
                      
                      var pilot_blacklist = [
                        'ping'
                      ];
                      
                      var cockpit_commands = [
                        'plugin.rovpilot.incrementPowerLevel'
                        ,'plugin.rovpilot.setPowerLevel'
                      ]                      
                      
                      switch(p.rov_role){
                        case 'pilot':
                         if (pilot_blacklist.indexOf(msg[0])!=-1){
                            return;
                         }
                        break;    
                        case 'co-pilot':
                         if (copilot_blacklist.indexOf(msg[0])!=-1){
                           return;
                         }
                        break;
                        default:
                          return; //If I get here, ignore the message and exit the method.
                      }
                      
                      if (cockpit_commands.indexOf(msg[0])!=-1){
                        _self.cockpit.emit.apply(_self.cockpit,msg);
                      } else {
                        _self.rov.emit.apply(_self.rov,msg);
                      }                      

                    });

                  p.on('close', function(){
                    console.log('closing connection')
                    _self.viewers--;
                    socket.off('signal',onSignalHanlder);
           //         _self.rov.offAny(onAnyHandler);
           //         _self.cockpit.off('x-h264-video.data',videodataHanlder);
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
  }
      PeerView.prototype.formatUsersMsg = function formatUsersMsg(peers){
        var msgData = peers.map(function(peer){
          return {
            role : peer.rov_role||'viewer',
            id : peer.peer_id,
            localAddress : peer.localAddress,
            localPort: peer.localPort,
            remoteAddress: peer.remoteAddress,
            remotePort: peer.remotePort,
            userName: peer.userName||'anonymous'
          };
        });
        return msgData;
      };

      PeerView.prototype.inputDefaults = function inputDefaults() {
        var self = this;
        return []
      };

      window.Cockpit.plugins.push(PeerView);

    }(window, document, $));
