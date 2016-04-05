/*
  This abstraction presents the Socket.io (and potentially other
  transports) as an EventEmiiter.  It takes care of forwarding
  the messages between the emitter and the message transport.
*/
(function() {
  var MessageManager = function(socket) {
    this.socket = socket;
    var self = this;
    //Apparently socket checks the last variable for a function callback and
    //does magic.  Have to send only the right number of arguments.
    this.onAny(function() {
      if (this.event !== 'newListener') {
        socket.emit.apply(socket,arguments);
      }
    });

    this.withHistory = {
      on: function on(aType, aListener){
            self.socket.withHistory.on(aType,aListener);
          }
    }

    this.on('newListener', function(aType, aListener) {
      if (aType!=='*'){
        socket.on(aType, aListener);
      }
    });
    return this;
  };
  MessageManager.prototype = new EventEmitter2({ newListener: true, wildcard: true });
  MessageManager.prototype.constructor = MessageManager;

  window.MessageManager = MessageManager;
})();
