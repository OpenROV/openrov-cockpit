/*
  This abstraction presents the Socket.io (and potentially other
  transports) as an EventEmiiter.  It takes care of forwarding
  the messages between the emitter and the message transport.

  API:
  To have the history sent, prefix the topic name that is being
  subscribed to with 'withHistory'.
*/
(function() {
  var root = this;

  var SocketIOStoreAndForward = function(io) {
    var self = this;
    this.eventCache = {};

    var ammendServerSideSocket = function(socket){
      var original_on = socket.on;
      var orignal_emit = socket.emit;
      var orignal_v_emit = socket.volatile.emit;

      socket.on = function(aType,aListener){
        if (aType.substring(0, 12) == "withHistory:"){
          console.log("go withHistory");
          aType = aType.slice(12);
          if (self.eventCache[aType]!==undefined){
            var d = self.eventCache[aType];
            aListener.call(d[0],d[1],d[2],d[3],d[4],d[5]);
          }
        }
        original_on.call(socket, aType, aListener);
      };

      socket.emit = function(aType,data1, data2, data3, data4, data5){
        self.eventCache[this.event]=[this,data1,data2,data3,data4,data5];
        orignal_emit.call(socket,aType,data1, data2, data3, data4, data5);
      };

      socket.volatile.emit = function(aType,data1, data2, data3, data4, data5){
        self.eventCache[this.event]=[this,data1,data2,data3,data4,data5];
        orignal_v_emit.call(socket,aType,data1, data2, data3, data4, data5);
      };

    }

    io.on('connection', function(socket) {
      ammendServerSideSocket(socket);
      var that = self;

      socket.on('withHistory',function(aType,aListener){
        if (that.eventCache[aType]!==undefined){
          var d = that.eventCache[aType];
          aListener.call(d[0],d[1],d[2],d[3],d[4],d[5]);
        } else {
          aListener();
        }
      });
    });


    return io;
  }


  if( typeof exports !== 'undefined' ) {
    if( typeof module !== 'undefined' && module.exports ) {
      exports = module.exports = SocketIOStoreAndForward
    }
    exports.SocketIOStoreAndForward = SocketIOStoreAndForward
  }
  else {
    root.SocketIOStoreAndForward = SocketIOStoreAndForward

    var withHistory = function(element){
      this.element = element;
    }

    withHistory.prototype = {
      on: function on(aType, aListener){
        var socket = this.element;
        this.element.emit('withHistory',aType,function(v1,v2,v3,v4,v5){
          if (v1 !== undefined){
            aListener(v1,v2,v3,v4,v5);
          }
          socket.on(aType,aListener);  //delay until the callback takes place to keep order
        })
      }
    }

    Object.defineProperty(window.io.Socket.prototype, "withHistory", {
    	get: function () {
    		Object.defineProperty(this, "withHistory", {
    			value: new withHistory(this)
    		});

    		return this.withHistory;
    	},
    	configurable: true,
    	writeable: false
    });
/*
    window.io.Socket.prototype.withHistory_on = function withHistory_on(aType, aListener){
      this.emit('withHistory',aType,function(v1,v2,v3,v4,v5){
        if (v1 !== undefined){
          aListener(v1,v2,v3,v4,v5);
        }
        this.on(aType,aListener);  //delay until the callback takes place to keep order
      });

    };
*/


  }


}).call(this); //on the bowser, this is the window object
