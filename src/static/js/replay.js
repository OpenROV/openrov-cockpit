(function () {
  $('#t')[0].userRole = 'REPLAY';
  window.cockpit.withHistory.on('blackbox-dixie-object', function (idb) {
    var emitter = window.cockpit.rov;
    var historicTime = new Date();
    var session = getParameterByName('rp');
    //Get the data for the session
    var spawn = Dexie.spawn;
    var listMP4Data = function (offset, limit) {
      return idb.telemetry_events.where('sessionID').equals(session).offset(offset).filter(function (item) {
        return item.event == 'x-h264-video.data';
      }).limit(limit).toArray();
    };
    var listMP4Data = function (lowerIdLimit, limit) {
      return idb.telemetry_events.get(lowerIdLimit).then(function (lastItem) {
        var lowerbounds = lastItem !== undefined ? lastItem.timestamp : 0;
        return idb.telemetry_events.where('[sessionID+timestamp]').between([
          session,
          lowerbounds
        ], [
          session,
          Infinity
        ], false, true).filter(function (item) {
          return item.event == 'x-h264-video.data';
        }).limit(limit).toArray();
      });
    };
    var listTelemetryData = function (offset, limit) {
      return idb.telemetry_events.where('sessionID').equals(session).offset(offset).filter(function (item) {
        return item.event !== 'x-h264-video.data';
      }).limit(limit).toArray();
    };
    var listTelemetryData = function (lowerIdLimit, limit) {
      return idb.telemetry_events.get(lowerIdLimit).then(function (lastItem) {
        var lowerbounds = lastItem !== undefined ? lastItem.timestamp : 0;
        return idb.telemetry_events.where('[sessionID+timestamp]').between([
          session,
          lowerbounds
        ], [
          session,
          Infinity
        ], false, true).filter(function (item) {
          return item.event !== 'x-h264-video.data';
        }).limit(limit).toArray();
      });
    };
    var listOtherData = function (offset, limit) {
      return idb.otherdata.where('sessionID').equals(session).offset(offset).limit(limit).toArray();
    };
    var listOtherData = function (lowerIdLimit, limit) {
      return idb.otherdata.get(lowerIdLimit).then(function (lastItem) {
        var lowerbounds = lastItem !== undefined ? lastItem.timestamp : 0;
        return idb.otherdata.where('[sessionID+timestamp]').between([
          session,
          lowerbounds
        ], [
          session,
          Infinity
        ], false, true).limit(limit).toArray();
      });
    };
    var timedDataGenerator = function (dataRefillFunction, callback, state) {
      if (state == null) {
        state = {
          buffer: [],
          dataoffset: 0,
          timeoffset: null,
          loadingdata: false
        };
      }
      if (state.loadingdata) {
        setTimeout(timedDataGenerator.bind(this, dataRefillFunction, callback, state), 100);
        return;
      }
      var limit = 25;
      if (state.dataoffset == null) {
        state.dataoffset = 0;
      }
      if (state.buffer == null) {
        state.buffer = [];
      }
      if (state.buffer.length < 35) {
        state.loadingdata = true;
        dataRefillFunction(state.dataoffset, limit).then(function (newdata) {
          if (newdata.length>0){
            state.buffer = state.buffer.concat(newdata);
            state.dataoffset = newdata[newdata.length - 1].id;
            state.loadingdata = false;
          } 
          if (state.buffer.length == 0){
            return false;  //end generator, no more data
          }
        });
      }
      if (state.timeoffset == null && state.buffer.length > 0) {
        state.timeoffset = Date.now().valueOf() - state.buffer[0].timestamp;
      }
      while (state.buffer.length > 0 && state.buffer[0].timestamp + state.timeoffset < Date.now().valueOf()) {
        callback(state.buffer.shift());
      }
      //nothing more to play, reschedule next call
      var nextCheck = 100;
      if (state.buffer.length > 0) {
        nextCheck = state.buffer[0].timestamp + state.timeoffset - Date.now().valueOf();
      }
      setTimeout(timedDataGenerator.bind(this, dataRefillFunction, callback, state), nextCheck);
    };
    
    window.OROV.startApp = function(){
    
    idb.telemetry_events.where('sessionID').equals(session).filter(function (item) {
      return item.event == 'x-h264-video.data';
    }).first().then(function (initFrame) {
      if (initFrame !== undefined) {
        emitter.on('request_Init_Segment', function (callback) {
          emitter.emit('x-h264-video.init', initFrame.data);
          if (typeof callback == 'function') {
            callback(initFrame.data);
          }
        });
        timedDataGenerator(listMP4Data, function (item) {
          emitter.emit('x-h264-video.data', item.data);
        });
        emitter.emit('CameraRegistration', {
          connectionType: 'rov',
          location: 'forward',
          videoMimeType: 'video/mp4',
          relativeServiceUrl: 'localhost'
        });
      }
      timedDataGenerator(listOtherData, function (item) {
        emitter.emit.apply(emitter, [item.event].concat(JSON.parse(item.data)));
      });
      timedDataGenerator(listTelemetryData, function (item) {
        emitter.emit.apply(emitter, [item.event].concat([item.data]));
      });
    });
  }
  });
}());  /*
      idb.mp4.collection.filter(function(item){item.sessionID == session}).first(function(item){
        idb.mp4.where("sessionID").equalsIgnoreCase(data[i].sessionID).toArray(function(j,dump){


      });

      collection.filter(function(item){item.sessionID == session}).first(function(last){

      });
 */
       //function (collection,playedindex)
       //
       // getNextMsg(palyedidnex) //greater than playedIndex
       // if nomoremessages, signal done
       // if (shouldPlay(msg) {
       //    (emit message)
       //    function(collection,message.index);
       //    return;
       // }
       // 
       // setTimeout(function(collection,playedindex),delay_until_should_be_played(message.time))
       // }
       //settimeout = to its timestamp corrected for current timestamp
