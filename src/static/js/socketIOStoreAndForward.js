/*
  This abstraction presents the Socket.io (and potentially other
  transports) as an EventEmiiter.  It takes care of forwarding
  the messages between the emitter and the message transport.

  API:
  To have the history sent, prefix the topic name that is being
  subscribed to with 'withHistory'.
*/
(function () {
  var root = this;
  var SocketIOStoreAndForward = function (io) {
    var self = this;
    this.eventCache = {};
    var ammendServerSideSocket = function (socket) {
      var original_on = socket.on;
      var orignal_emit = socket.emit;
      var orignal_v_emit = socket.volatile.emit;
      socket.on = function (aType, aListener) {
        if (aType.substring(0, 12) == 'withHistory:') {
          console.log('go withHistory');
          aType = aType.slice(12);
          if (self.eventCache[aType] !== undefined) {
            var d = self.eventCache[aType];
            aListener.apply(d.context, d.args);
          }
        }
        original_on.call(socket, aType, aListener);
      };
      socket.emit = function (aType, data1, data2, data3, data4, data5) {
        self.eventCache[this.event] = {
          context: this,
          args: arguments
        };
        orignal_emit.apply(socket, arguments);
      };
      socket.volatile.emit = function (aType, data1, data2, data3, data4, data5) {
        self.eventCache[this.event] = {
          context: this,
          args: arguments
        };
        orignal_v_emit.apply(socket, arguments);
      };
    };
    io.on('connection', function (socket) {
      ammendServerSideSocket(socket);
      var that = self;
      socket.on('withHistory', function (aType, aListener) {
        if (that.eventCache[aType] !== undefined) {
          var d = that.eventCache[aType];
          aListener.apply(d.context, d.args);
        } else {
          aListener();
        }
      });
      socket.on('fromcache', function (aType, callback) {
        if (that.eventCache[aType] !== undefined) {
          var d = that.eventCache[aType];
          callback.apply(d.context, d.args);
        } else {
          callback();
        }
      });
    });
    return io;
  };
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = SocketIOStoreAndForward;
    }
    exports.SocketIOStoreAndForward = SocketIOStoreAndForward;
  } else {
    root.SocketIOStoreAndForward = SocketIOStoreAndForward;
    var withHistory = function (element) {
      this.element = element;
    };
    withHistory.prototype = {
      on: function on(aType, aListener) {
        var socket = this.element;
        this.element.emit('withHistory', aType, function () {
          if (arguments.length > 0) {
            aListener.apply(this, arguments);
            if (socket.lvcCache) {
              var args = new Array(arguments.length);
              for (var i = 0; i < args.length; ++i) {
                //i is always valid index in the arguments object
                args[i] = arguments[i];
              }
              socket.lvcCache[aType] = args;
            }
          }
          socket.on(aType, aListener);  //delay until the callback takes place to keep order
        });
      }
    };
    Object.defineProperty(window.io.Socket.prototype, 'withHistory', {
      get: function () {
        Object.defineProperty(this, 'withHistory', { value: new withHistory(this) });
        return this.withHistory;
      },
      configurable: true,
      writeable: false
    });
  }
}.call(this));  //on the bowser, this is the window object
