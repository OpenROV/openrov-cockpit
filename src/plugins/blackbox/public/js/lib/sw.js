  importScripts('cockpitsocket/socket.io.js',
    "components/dexie/dist/dexie.min.js",
    "plugin/blackbox/js/lib/idb.js",
    "js/simpledb.js"
  );

  self.addEventListener('install', function(event) {
    self.skipWaiting();
  });

  self.addEventListener('sync', function(event) {
    var log = function(str){
      console.log(str);
    }
    var log_trace = function(str){
      console.log(str);
    }
    var isSyncing = false;
    var idb = defineBlackBoxDB();
    var sessionID = event.tag.substring('sync-session:XXXXXXXXXX:'.length);

    var rov_session_meta = {
      sessionID: sessionID,
      lastid: null,
      length: null
    };

    function nextTelemetryItems(lowerIdLimit, limit) {

        // .equals(sessionID)
        // .and(function(x) {
        //   return x.id > lowerIdLimit
        // })

      return idb.telemetry_events
        .get(lowerIdLimit)
        .then(function(lastItem){
            var lowerbounds = lastItem!==undefined?lastItem.timestamp:0;
            return idb.telemetry_events
            .where('[sessionID+timestamp]')
            .between([sessionID,lowerbounds],[sessionID,Infinity],false,true) //exclude begining of range, include end of range
            .limit(limit)
            .toArray()
        })
      

    }

   //var heartbeatTimer = null;    
    var dbconn = null;
    var uniqueID = 100000000 * Math.random();
    event.waitUntil(
      Promise.resolve(undefined)
      .then(function() {
        return simpleDB.open('sync')
          .then(function(db) {
            dbconn = db;
            return db.get('syncReservation');
          })
          .then(function(syncReservation) {
            if ((syncReservation == null) || ((Date.now() - syncReservation.lastUpdate) > 30 * 1000)) {
              return dbconn.set('syncReservation', {
                uuid: uniqueID,
                lastUpdate: Date.now()
              })
            }
          })
          .catch(function(err) {
            throw new Error(err);
          })
      })
      .then(function() {
        return dbconn.get('syncReservation')
      })
      .then(function(result) {
        if (result.uuid !== uniqueID) {
          //Another sync process is running. End gracefully.
          log_trace('Another background sync process is running. Ending this trigger');
          return;
        }
        log_trace('Registered as running Sync process');
        return Promise.resolve(null)
          .then(lastTelemetryItem.bind(this, idb,sessionID))
          .then(function(result) {
            rov_session_meta.lastid = result.id;
          })
          .then(firstTelemetryItem.bind(this, idb,sessionID))
          .then(function(result) {
            rov_session_meta.firstid = result.id;
            rov_session_meta.length = rov_session_meta.lastid - rov_session_meta.firstid + 1;
          })
          .then(function() {
            return simpleDB.open('sync')
              .then(function(db) {
                return db.get(sessionID);
              })
          })
          .then(function(sessionDetails) {
              return new Promise(function(resolve, reject) {
                  var socket = io('http://localhost:3000', {
                    path: '/dataapi_10',
                    'multiplex': false,
                    query: 'token=' + sessionDetails.id_token,
                    transports: ['websocket']
                  });

                  socket.on("error", function(error) {
                    if (error.type == "UnauthorizedError" || error.code == "invalid_token") {
                      // redirect user to login page perhaps?
                      log("User's token has expired");
                    }
                    reject(error.message);
                  });

                  socket.on('close', function() {
                    if (isSyncing){
                      log_trace('sync socket.io closed');
                      isSyncing=false;
                      reject();
                    }
                  });
                  socket.on('connect', function() {
                    //Note this triggers on reconnects as well.
                    if (isSyncing) return;

                    dbconn.get('syncReservation')
                    .then(function(result) {
                        if (result.uuid !== uniqueID) {
                          reject();
                        } else {
                          socket.emit('save-telemetry', rov_session_meta);
                          isSyncing = true;
                        }
                    });
                  });

                  //From here we need to return a promise for the sync complete to keep the background process
                  //running

                  socket.on('send-data', function(last_id_acked, callback) {
                    dbconn.set('syncReservation',{uuid:uniqueID,lastUpdate:Date.now()})
                    .catch(function(err){
                      throw new Error(err);
                    })

                    //TODO: Investigate having the client open up a socket.io conenction
                    //to the sync server to check for realtime sync updates instead
                    //of using the sync table.
                    dbconn.get(sessionID)
                    .then(function(sessionState){
                      sessionState.lastIDSynced=last_id_acked;
                      sessionState.lastID=rov_session_meta.lastid;
                      sessionState.firstID=rov_session_meta.firstid;
                      sessionState.status='syncing';
                      dbconn.set(sessionID,sessionState);
                    }) 


                    
                    nextTelemetryItems(last_id_acked || rov_session_meta.firstid-1, 20)
                      .then(function(nextItemsToSync) {
                        //if done, syncPromise.resolve();
                        if (nextItemsToSync.length == 0) {
                          resolve();
                        }
                        callback(nextItemsToSync);
                      })
                      .catch(function(err){
                        console.log(err);
                        reject(err.toString());
                      })
                  });

                })
                .then(function() {
                  var db = null;
                  self.registration.showNotification("Background sync complete for:" + sessionID);
                  return simpleDB.open('sync')
                  .then(function(dbconn){
                    db=dbconn;
                    return db.get(sessionID);
                  })                   
                  .then(function(sessionState){
                    sessionState.status="complete"
                    db.set(sessionID,sessionState);
                  })   
                })
                .catch(function(err) { 
                  self.registration.showNotification("Background sync errored for:" + sessionID);
                  throw err;                  
                });
            }
          )
          .catch(function(err){
            throw new Error(err);
          })          
      })
      .then(function(){
        isSyncing=false;
      })
      .catch(function(err){
        isSyncing=false;
        throw new Error(err);
      })      
    )



    self.registration.showNotification("Sync event fired for session:" + sessionID);
  });