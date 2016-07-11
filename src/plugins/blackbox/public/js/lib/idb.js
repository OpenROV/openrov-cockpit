function defineBlackBoxDB(callback){
    //Instructions to upgrade: https://github.com/dfahlander/Dexie.js/wiki/Design
    var idb = new Dexie("openrov-blackbox2");
    idb.on('error', function (err) {
        // Catch all uncatched DB-related errors and exceptions
        console.error(err.message);
        console.dir(err);
    });
    idb.on('ready', function () {
      if(typeof(callback)=='function'){
        callback(idb);
      }
    });     

    idb.version(8).stores({
        telemetry_events: 'id++,timestamp,sessionID,event,[sessionID+timestamp]',
        sessions: 'timestamp,sessionID',
        otherdata: 'id++,timestamp,sessionID,event,[sessionID+timestamp]'
    })
    .upgrade(function(){
      console.log("updating to 8");
    });
    idb.version(7).stores({
        telemetry_events: 'id++,timestamp,sessionID,event',
        sessions: 'timestamp,sessionID',
        otherdata: 'id++,timestamp,sessionID,event',
        navdata: null,
        telemetry: null,
        mp4:null
    }).upgrade(function(trans){
      console.log('upgrade to 7');
    });
    idb.version(6).stores({
        telemetry_events: 'id++,timestamp,sessionID,event',
        sessions: 'timestamp,sessionID',
        otherdata: 'id++,timestamp,sessionID,event',
        navdata: 'id++,timestamp,sessionID',
        telemetry: 'id++,timestamp,sessionID',
        mp4: 'id++,timestamp,sessionID'
    }).upgrade(function(trans){
      trans.mp4.each(function(data,cursor){
        cursor.delete(data);
        delete data.id;
        data.event='x-h264-video.data'
        trans.db.telemetry_events.add(data);
      });

      trans.navdata.each(function(data,cursor){
        cursor.delete(data);
        delete data.id;
        data.event='plugin.navigationData.data'
        trans.db.telemetry_events.add(data);
      });
      //intentionally not handling gps data since it has
      //not been rolled out yet.
      trans.telemetry.each(function(data,cursor){
        cursor.delete(data);
        delete data.id;
        data.event='status'
        trans.db.telemetry_events.add(data);

      });      

    }); 

    idb.version(5).stores({
        telemetry_events: 'id++,timestamp,sessionID,event',
        sessions: 'timestamp,sessionID',
        otherdata: 'id++,timestamp,sessionID,event',
        navdata: 'id++,timestamp,sessionID',
        telemetry: 'id++,timestamp,sessionID',
        mp4: 'id++,timestamp,sessionID'
    }).upgrade(function(trans){
      console.log('upgrade to 5 before 6');
      trans.db.telemetry_events.add({timestamp:Date.now(),sessionID:'init',event:'dbinit'})
    });

    idb.version(4).stores({
        navdata: 'id++,timestamp,sessionID',
        telemetry: 'id++,timestamp,sessionID',
        mp4: 'id++,timestamp,sessionID',
        sessions: 'timestamp,sessionID',
        otherdata: 'id++,timestamp,sessionID,event',  
    }).upgrade(function(trans){
      trans.mp4.each(function(data,cursor){
        if (data.time!==undefined){
          delete data.id;
          trans.telemetry.add(data);
          cursor.delete(data);
        }
      });
    });
    idb.version(3).stores({
        navdata: 'id++,timestamp,sessionID',
        telemetry: 'id++,timestamp,sessionID',
        mp4: 'id++,timestamp,sessionID',
        sessions: 'timestamp,sessionID'
    }).upgrade(function(trans){
      trans.navdata.each(function(data, cursor){
        data.sessionID = 'pre-session'
        cursor.update(data);
      });
      trans.telemetry.each(function(data, cursor){
        data.sessionID = 'pre-session'
        cursor.update(data);
      });
    });

    return idb;
  }

  function lastTelemetryItem(idb,sessionID) {
    return idb.telemetry_events
      .where('sessionID')
      .equals(sessionID)
      .last()
  }

  function firstTelemetryItem(idb,sessionID) {
    return idb.telemetry_events
      .where('sessionID')
      .equals(sessionID)
      .first()
    }