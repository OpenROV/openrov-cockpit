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

  var EventEmiiterStoreAndForward = function(coveredEventEmitter) {
    var self = this;
    this.eventCache = {};
    var original_on = coveredEventEmitter.on;

    coveredEventEmitter.withHistory = {};


    coveredEventEmitter.withHistory.on = function(aType,aListener){
      if (self.eventCache[aType]!==undefined){
        var d = self.eventCache[aType];
        aListener.call(d[0],d[1],d[2],d[3],d[4],d[5]);
      }
      original_on.call(coveredEventEmitter, aType, aListener);
    };

    coveredEventEmitter.onAny(function(data1, data2, data3, data4, data5){
      self.eventCache[this.event]=[this,data1,data2,data3,data4,data5];
    });

    return coveredEventEmitter;
  }



  if( typeof exports !== 'undefined' ) {
    if( typeof module !== 'undefined' && module.exports ) {
      exports = module.exports = EventEmiiterStoreAndForward
    }
    exports.EventEmiiterStoreAndForward = EventEmiiterStoreAndForward
  }
  else {
    root.EventEmiiterStoreAndForward = EventEmiiterStoreAndForward
  }


}).call(this); //on the bowser, this is the window object
