/*
  This abstraction presents the Socket.io (and potentially other
  transports) as an EventEmiiter.  It takes care of forwarding
  the messages between the emitter and the message transport.
*/
(function() {
  var SocketIOEmitter = function(socket) {
    this.socket = socket;
    var self = this;
    this.senderID = generateUUID();
    //Apparently socket checks the last variable for a function callback and
    //does magic.  Have to send only the right number of arguments.
    this.onAny(function() {
      if (this.event !== 'newListener') {
        var args = new Array(arguments.length);
        for(var i = 0; i < args.length; ++i) {
                    //i is always valid index in the arguments object
            args[i] = arguments[i];
        }
        if (args[args.length-1]===self.senderID) {return;}
//        args.push(self.senderID)
        socket.emit.apply(socket,[this.event].concat(args));
      }
    });

    this.withHistory = {
      on: function on(aType, aListener){
            self.socket.withHistory.on(aType,aListener);
          }
    }

    var listeningTo = {};
    this.on('newListener', function(aType, aListener) {
      if (aType!=='*'){
//        socket.on(aType, aListener);
        if (listeningTo[aType]===undefined){
          socket.on(aType,function(){
            var args = new Array(arguments.length);
            for(var i = 0; i < args.length; ++i) {
                        //i is always valid index in the arguments object
                args[i] = arguments[i];
            }
            args = args.filter(function(item){return item!==null});
            if (args[args.length-1]===self.senderID) {return;}
            args.push(self.senderID)
            self.emit.apply(self,[aType].concat(args));
          })
          listeningTo[aType]=true;
        }
      }
    });
    return this;
  };
  SocketIOEmitter.prototype = new EventEmitter2({ newListener: true, wildcard: true });
  SocketIOEmitter.prototype.constructor = SocketIOEmitter;

  window.SocketIOEmitter = SocketIOEmitter;
})();
