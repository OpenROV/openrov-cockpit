/*
  This abstraction presents the Socket.io (and potentially other
  transports) as an EventEmiiter.  It takes care of forwarding
  the messages between the emitter and the message transport.
*/
(function() {
  var socketIOtoEmitterBridge = function(socket,emitter) {
    this.socket = socket;
    var self = this;
    this.emitter = emitter;
    this.senderID = generateUUID();
    this.cleanupFunctions = [];
    
    
    //Every time something emits on the EventEmitter, we need to forward those on to the socket.IO.  Technically we could improve 
    //on this by handling it like we do the SocketIO->eventEmitter below, by listening to the registrations in Socket.IO and only 
    //forwarding those messages when something emits them on the emitter.  But then again, socket.IO is probablly already doing that
    //filtering for us... so it might just add complexity with no real gain.
    
    //Apparently socket checks the last variable for a function callback and
    //does magic.  Have to send only the right number of arguments.
    emitter.onAny(function() {
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


    //If the emitter has a withHistory function, we need to bridge to the data cache in the socket.io system.  We do so by
    //checking for the last value in the cache and "seeding" the cache in the emitter with the value before letting the 
    //original withHistory call take place.
    if (emitter.withHistory){
        var orig_wh = emitter.withHistory;
        emitter.withHistory=function(type,fn){
            self.socket.emit('fromcache',type,function(){
                emitter.emit(type,arguments); //TODO: If this works, use the args pattern for performance.                
            });
            emitter.orig_wh(type,fn);
        }
        this.cleanupFunctions.push(function(){
            emitter.withHistory=orig_wh;
        })
        
    }

    var listeningTo = {};
    var linkSocketIOEventToEmitter = function(aType){
        if (listeningTo[aType]===undefined){
          var handleEvent = function(){
            var args = new Array(arguments.length);
            for(var i = 0; i < args.length; ++i) {
                        //i is always valid index in the arguments object
                args[i] = arguments[i];
            }
            args = args.filter(function(item){return item!==null});
            if (args[args.length-1]===self.senderID) {return;}
            args.push(self.senderID)
            self.emitter.emit.apply(self.emitter,[aType].concat(args));
          };
          self.socket.on(aType,handleEvent);
          self.cleanupFunctions.push(function(){
              self.socket.off(aType,handleEvent);
          })
          listeningTo[aType]=true;
        }  
    };

    //The emitter might already have listeners, if so we need to wire those up to Socket.IO
    Object.keys(emitter._events).forEach(function(event){
        linkSocketIOEventToEmitter(event);
    });

    //Everytime a function registers a listener with the eventEmitter, we need to also register that event with socket.IO so that
    //it will send along those messages.  When the messages arrive, we need to then emit them on the EventEmitter.
    emitter.on('newListener', function(aType, aListener) {
      if (aType!=='*'){
        linkSocketIOEventToEmitter(aType);
      }
    });
    
    return this;
  };
  
  //This will undo the linkage between the emitter and the socket.
  socketIOtoEmitterBridge.prototype.stop = function stop(){
      cleanupFunctions.forEach(function(fn){
        fn();
      });
      cleanupFunctions = [];
  }

  window.SocketIOtoEmitterBridge = socketIOtoEmitterBridge;
})();
