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
      this.internet = null;

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
          $.getScript(self.settings.webRTCSignalServerURI + "/socketiop2p.min.js", function() {
              var _self = self
              var P2P = window.P2P;
              var io = window.io;
              var socket = io(self.settings.webRTCSignalServerURI);

              var opts = {
                peerOpts: {
                  channelConfig: {
                    ordered: false,
                    maxRetransmits: 0
                  }
                },
                autoUpgrade: false
              }
              var p2p = new P2P(socket, opts);
              self.internet = p2p;

              p2p.on('ready', function() {
                p2p.usePeerConnection = true;
                p2p.emit('peer-obj', {
                  peerId: peerId
                });
              })

              // this event will be triggered over the socket transport
              // until `usePeerConnection` is set to `true`
              p2p.on('peer-msg', function(data) {
                console.log(data);
              });

              p2p.on('upgrade', function(data) {
                console.log("Connection upgraded to WebRTC")
                p2p.useSockets = false
                p2p.emit('peer-msg','ROV Cockpit plugin attached');

                var onevent = _self.rov.socket.onevent;
                _self.rov.socket.onevent = function (packet) {
                    var args = packet.data || [];
                    onevent.call (this, packet);    // original call
                  //  emit.apply   (this, ["*"].concat(args));      // additional call to catch-all
                    args = args.filter(function(n){ return n != null });
                    _self.internet.emit.apply(_self.internet,args);
                };

                _self.rov.onAny(function() {
                  var event = this.event;
                  if (event !== 'newListener') {
                  //  console.log(event);
                    _self.internet.emit(event, arguments);
                  }
                });

                _self.internet.on('*',function() {
                  var event = this.event;
                  if (event !== 'newListener') {
                    _self.rov.emit(event, arguments);
                  }
                });

                //Since the video comes in via a different route...
                _self.cockpit.on('x-h264-video.data',function(data){
                  _self.internet.emit('x-h264-video.data',data);
                });

                _self.internet.on('request_Init_Segment',function(fn){
                  _self.rov.emit('request_Init_Segment',function(init){
                    if ((fn!==undefined) && (typeof(fn) === 'function')){
                      fn(init);
                    } else {
                      _self.internet.emit('x-h264-video.init',init);
                    }
                  });
                });

              })

              p2p.on('peer-error', function(data) {
                console.log("Error during signaling:" + data);
              })

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
