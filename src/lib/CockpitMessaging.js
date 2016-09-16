(function () {
  var EventEmitter2 = require('eventemitter2').EventEmitter2;
  var CockpitMessaging = function (io, opts) {
    var listeners = [];
    var sockets = [];
    var ignoreEvents = [
        'newListener',
        'removeListener'
      ];
    this.volatile = {
      emit: function () {
        if (ignoreEvents.includes(arguments[0])) {
          return;
        }
        var args = new Array(arguments.length);
        for (var i = 0; i < args.length; ++i) {
          //i is always valid index in the arguments object
          args[i] = arguments[i];
        }
        if (args[0] == [args[1]]) {
          args.shift();  //After an upgrade of eventemitter, it appears the arguments now include the event type.
        }
        sockets.forEach(function (socket) {
          socket.volatile.emit.apply(socket, args);
        });
      }
    };
    this.onAny(function () {
      if (ignoreEvents.includes(arguments[0])) {
        return;
      }
      var event = this.event;
      var args = new Array(arguments.length);
      for (var i = 0; i < args.length; ++i) {
        //i is always valid index in the arguments object
        args[i] = arguments[i];
      }
      if (args[0] == [args[1]]) {
        args.shift();  //After an upgrade of eventemitter, it appears the arguments now include the event type.
      }
      sockets.forEach(function (socket) {
        socket.emit.apply(socket, args);
      });
    });
    this.on('newListener', function (aType, aListener) {
      if (aType !== 'newListener') {
        listeners.push({
          type: aType,
          fn: aListener
        });
      }
    });
    io.on('connection', function (socket) {
      sockets.push(socket);
      listeners.forEach(function (listener) {
        socket.on(listener.type, listener.fn);
      });
      socket.on('disconnect', function () {
        var i = sockets.indexOf(socket);
        delete sockets[i];
      });
    });
  };
  CockpitMessaging.prototype = new EventEmitter2({
    wildcard: true,
    newListener: true
  });
  CockpitMessaging.prototype.constructor = CockpitMessaging;
  module.exports = CockpitMessaging;
}());