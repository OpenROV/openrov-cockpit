 (function() {

    $('#t')[0]['userRole']='REPLAY';
     window.cockpit.withHistory.on('blackbox-dixie-object', function(idb) {


         var emitter = window.cockpit.rov;

         var historicTime = new Date();

         var session = getParameterByName('rp');
         //Get the data for the session
         session = '6a96e08f-3c45-4468-8815-d1013ee64a3f';

         var spawn = Dexie.spawn;

         var listNavData = function (offset,limit){

            return idb.navdata
            .where('sessionID')
            .equals(session)
            .offset(offset)
            .limit(limit)
            .toArray()    
         }
         var listMP4Data = function (offset,limit){

            return idb.mp4
            .where('sessionID')
            .equals(session)
            .offset(offset)
            .limit(limit)
            .toArray()    
         }
          var listTelemetryData = function (offset,limit){

            return idb.telemetry
            .where('sessionID')
            .equals(session)
            .offset(offset)
            .limit(limit)
            .toArray()    
         }                 

          var listOtherData = function (offset,limit){

            return idb.otherdata
            .where('sessionID')
            .equals(session)
            .offset(offset)
            .limit(limit)
            .toArray()    
         }
         var timedDataGenerator = function(dataRefillFunction,callback,state){
             if (state==null){
                 state = {buffer:[],dataoffset:0,timeoffset:null,loadingdata:false};
             }
             if (state.loadingdata){
                 setTimeout(timedDataGenerator.bind(this,dataRefillFunction,callback,state),100);
                 return;
             } 
             var limit = 25;
             if (state.dataoffset==null){
                 state.dataoffset = 0;
             }
             if (state.buffer == null){
                 state.buffer = [];
             }
             if (state.buffer.length<35){
                 state.loadingdata=true;
                 dataRefillFunction(state.dataoffset,limit)
                 .then(function(newdata){
                    state.buffer=state.buffer.concat(newdata);
                    state.dataoffset+=limit;
                    state.loadingdata=false;  
                    if (state.buffer.length==0){
                        return false; //end generator, no more data
                    }
                                   
                 })  
             }
             if ((state.timeoffset == null) && (state.buffer.length>0)){
                 state.timeoffset = Date.now().valueOf()-state.buffer[0].timestamp;
             }    
             while(state.buffer.length>0 && (state.buffer[0].timestamp+state.timeoffset<Date.now().valueOf())){
                  callback(state.buffer.shift());
             }
             //nothing more to play, reschedule next call
             var nextCheck=100;
             if (state.buffer.length>0){
                nextCheck = (state.buffer[0].timestamp+state.timeoffset)-Date.now().valueOf();
             }
             setTimeout(timedDataGenerator.bind(this,dataRefillFunction,callback,state),nextCheck);
         }

         idb.mp4
            .where('sessionID')          
            .equals(session)      
            .first()
            .then(function(initFrame){

                if (initFrame!==undefined){
                    emitter.on('request_Init_Segment',function(callback){
                        emitter.emit('x-h264-video.init',initFrame.data);
                        if (typeof(callback)=='function'){
                            callback(initFrame.data);
                        }
                    });

                    timedDataGenerator(listMP4Data,function(item){
                        emitter.emit('x-h264-video.data',item.data);
                    });

                    emitter.emit('CameraRegistration',{connectionType:'rov',location:'forward',videoMimeType:'video/mp4',relativeServiceUrl:'localhost'});
                
                }
                timedDataGenerator(listNavData,function(item){
                    emitter.emit('plugin.navigationData.data',item);
                });

                timedDataGenerator(listOtherData,function(item){
                    emitter.emit.apply(emitter,[item.event].concat(JSON.parse(item.data)));
                });

                timedDataGenerator(listTelemetryData,function(item){
                    emitter.emit('status',item);
                });   
   
                              
            })    

     });
 })();

 /*
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