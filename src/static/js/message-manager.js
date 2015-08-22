/*
  This abstraction presents the Socket.io (and potentially other
  transports) as an EventEmiiter.  It takes care of forwarding
  the messages between the emitter and the message transport.
*/
(function() {
  var MessageManager = function(socket) {
    this.socket = socket;

    //Apparently socket checks the last variable for a function callback and
    //does magic.  Have to send only the right number of arguments.
    this.onAny(function(data1, data2, data3, data4, data5) {
      if (this.event !== 'newListener') {
        if (data2 === undefined) {
          socket.emit(this.event,data1);
        } else if (data3 === undefined){
          socket.emit(this.event,data1,data2);
        } else if (data4 === undefined){
          socket.emit(this.event,data1,data2,data3);
        } else if (data4 === undefined){
          socket.emit(this.event,data1,data2,data3,data4);
        } else {
          socket.emit(this.event, data1, data2, data3, data4, data5);
        }
      }
    });


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
