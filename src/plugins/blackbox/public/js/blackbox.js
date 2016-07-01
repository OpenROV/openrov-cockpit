(function (window, document, jQuery) {
  'use strict';
  var plugins = namespace('plugins');
  const maxVideoSegmentSize = 200000000;

  //jQuery.getScript('/components/dexie/dist/latest/Dexie.js');

  var head = document.getElementsByTagName("head")[0];
  var js = document.createElement("script");
  js.type = "text/javascript";
  js.src = 'components/dexie/dist/dexie.min.js';
  head.appendChild(js);

  var js = document.createElement("script");
  js.type = "text/javascript";
  js.src = 'components/comma-separated-values/csv.min.js';
  head.appendChild(js);

  var js = document.createElement("script");
  js.type = "text/javascript";
  js.src = 'plugin/blackbox/js/lib/idb.js';
  head.appendChild(js);

    var js = document.createElement("script");
  js.type = "text/javascript";
  js.src = 'js/simpledb.js';
  head.appendChild(js);

  var Blackbox = function Blackbox(cockpit) {
    console.log('Loading Blackbox plugin.');
    this.cockpit = cockpit;
    this.recording = false;
    this.idb;
    this.sessionID = this.newSession();
    this.eventBuffer = [];
    this.otherBuffer = [];
  
  };

  plugins.Blackbox = Blackbox;


  Blackbox.prototype.inputDefaults = function inputDefaults() {
    var self = this;
    return [
      {
        name: 'blackbox.record',
        description: 'Start recording telemetry data.',
        defaults: { keyboard: 'r' },
        down: function() { self.toggleRecording();  }
      }
    ]
  }

  Blackbox.prototype.listen = function listen() {
    var self = this;

    if ((window.Dexie===undefined) || (window.CSV===undefined)){
//      $.getScript('/components/dexie/dist/latest/Dexie.js',function(){
//        self.listen();
//      });
      setTimeout(function(){self.listen()},1000);
      return;
    }
    this.idb = this.defineDB(function(idb){self.cockpit.emit('blackbox-dixie-object',idb)}); //Readies the DB, ensures schema is consistent
    
    this.idb.on('error', function (err) {
        // Catch all uncatched DB-related errors and exceptions
        console.error(err.message);
        console.dir(err);
        self.stopRecording();
    });

    this.idb.open()
    .catch(function(err){
      throw new Error(err);
    });

    var OnAnyBlacklist = [
      'plugin.navigationData.data',
      'plugin.gps.data',
      'status',
      'x-h264-video.data',
      'x-h264-video.init',
      'plugin-blackbox-export',
      'plugin-blackbox-recording-start',
      'plugin-blackbox-recording-stop',
      'plugin-blackbox-get-sessions',
      'plugin-blackbox-sessions',
    ]
    this.cockpit.onAny(function(){
      if(OnAnyBlacklist.includes(this.event)){return;}
      if (this.event !== 'newListener') {
        var args = new Array(arguments.length);
        for(var i = 0; i < args.length; ++i) {
                    //i is always valid index in the arguments object
            args[i] = arguments[i];
        }      
        self.logOtherData(this.event,args);
      }
    });

    this.cockpit.rov.on('plugin.navigationData.data', function (data) {
      if (!jQuery.isEmptyObject(data)) {
        self.logEventData('plugin.navigationData.data',data);
      }
    });
    this.cockpit.on('plugin.gps.data', function (data) {
      if (!jQuery.isEmptyObject(data)) {
        self.logEventData('plugin.gps.data',data);
      }
    });    
    this.cockpit.withHistory.on('status', function (data) {
      if (!jQuery.isEmptyObject(data)) {
        self.logEventData('status',data);
      }
    });
    this.cockpit.on('x-h264-video.data', function (data) {
      //TODO: Will generalize to pass all video events from all
      //cameras that are choosen for recording
       self.logMP4Video('x-h264-video.data',data);
    });
    this.cockpit.on('plugin-blackbox-export', function(options){
      self.exportData(options);
    });

    this.cockpit.on('plugin-blackbox-recording-start', function(){
      self.startRecording();
    });

    this.cockpit.on('plugin-blackbox-sync-session', function(sessionID){
      self.syncSession(sessionID);
    });

    this.cockpit.on('plugin-blackbox-recording-stop', function(){
      self.stopRecording();
    });

    this.cockpit.on('plugin-blackbox-get-sessions', function(callback){
      self.recordedSessions(callback);
    });

    this.cockpit.on('plugin-blackbox-recording?', function(fn){
      if(typeof(fn) === 'function'){
        fn(self.recording);
      }
    });

    this.recordedSessions(function(sessions){
        self.cockpit.emit('plugin-blackbox-sessions',sessions)
    });

  };

  var sessionIDRecorded = false;
  Blackbox.prototype.newSession = function newSession(){
     return generateUUID();
  }

  //TODO: Add sessions collection that each unique session is placed
  var _recordedSessions = function recordedSessions(idb,callback){
      idb.sessions.toArray(function(data){
        for(var i=0;i<=data.length;i++){
          if(data[i].sessionID==null){
            data[i].sessionID='';
          }
          idb.telemetry_events.where("sessionID").equalsIgnoreCase(data[i].sessionID).filter(function(item){return item.event=="x-h264-video.data"}).toArray(function(j,dump){
            var sizeofData = 0
            var arrayOfData = dump.map(function(item){
              var converted = new Uint8Array(item.data);
              sizeofData+=converted.length;
              return converted;
            });
            var segments = Math.ceil(sizeofData/maxVideoSegmentSize);
            data[j].VideoSegments = new Array(segments);
            if (j==data.length-1){
              callback(data);
            }
          }.bind(this,i));
        }
      });
  };

  Blackbox.prototype.recordedSessions = function recordedSessions(callback){
      _recordedSessions(this.idb,callback);
  }

  Blackbox.prototype.toggleRecording = function toggleRecording() {
    if (this.recording){
      this.stopRecording();
    } else {
      this.startRecording();
    }
  };


  function formatBytes(bytes,decimals) {
     if(bytes == 0) return '0 Byte';
     var k = 1000; // or 1024 for binary
     var dm = decimals + 1 || 3;
     var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
     var i = Math.floor(Math.log(bytes) / Math.log(k));
     return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  Blackbox.prototype.startRecording = function startRecording() {
    if (this.recording) {
      return;
    };
    var self=this;
    console.log('Recording Telemetry');
    var blackbox = this;

    var commitBuffers= function(){
         self.idb.transaction("rw", self.idb.telemetry_events,self.idb.otherdata,function() {
          while(self.eventBuffer.length>0){
            self.idb.telemetry_events.add(self.eventBuffer.shift());
          }
          while(self.otherBuffer.length>0){
            self.idb.otherdata.add(self.otherBuffer.shift());
          }          
        })
        .then(function () {
          // Transaction complete.
        })
        .catch(function (error) {
            console.error(error);
            self.stopRecording();
        });
      if ((self.recording)|| (self.eventBuffer.length>0 || self.otherBuffer.length>0) ){
        setTimeout(commitBuffers.bind(self),1000);
        navigator.webkitTemporaryStorage.queryUsageAndQuota (
            function(usedBytes, grantedBytes) {
                console.log('we are using ', formatBytes(usedBytes,2), ' of ', formatBytes(grantedBytes,2), ' ', formatBytes(grantedBytes-usedBytes,2),' remaining.');
            },
            function(e) { console.log('Error', e);  }
        );
      }
    }

    //Create the session
    this.idb.open()
    .then(function(){
      if(!sessionIDRecorded){
        self.idb.sessions.add({sessionID:self.sessionID,timestamp:Date.now()});
        self.recordedSessions(function(sessions){
          self.cockpit.emit('plugin-blackbox-sessions',sessions)
        });
        sessionIDRecorded=true;
      }      
      self.recording = true;
      self.cockpit.emit('plugin-blackbox-recording-status',true);
      commitBuffers.call(self);
    })
    .catch(function(err){
      throw new Error(err);
    })    


  };

  Blackbox.prototype.stopRecording = function stopRecording() {
    if (this.recording) {
      console.log('Stopping Telemetry');
      this.recording = false;
      this.cockpit.emit('plugin-blackbox-recording-status',false);
    }
  };
  var initFrame=null;

  window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder ||
                       window.MozBlobBuilder;

  Blackbox.prototype.logMP4Video = function logMP4Video(event,data) {
    var self=this;
    if (!this.recording) {
      return;
    }
    if (initFrame==null){
      this.cockpit.emit('request_Init_Segment', function(init) {
        initFrame=init;
        self.logMP4Video.call(self,event,init);
      });
    } else {
    this.eventBuffer.push({timestamp: Date.now(),sessionID:this.sessionID,event:event,data:data});
    }

  };

  Blackbox.prototype.logEventData = function logEventData(event,data) {
    var self=this;
    if (!this.recording) {
      return;
    }
    data.timestamp = Date.now();
    data.sessionID= this.sessionID;
    data.event=event;
    this.eventBuffer.push(data);

  };

  Blackbox.prototype.logOtherData = function logOtherData(event,data) {
    var self=this;
    if (!this.recording) {
      return;
    }
    var otherdata={event:event,data:JSON.stringify(data)};
    otherdata.timestamp = Date.now();
    otherdata.sessionID= this.sessionID;
    this.otherBuffer.push(otherdata);

  };  

  Blackbox.prototype.defineDB = function defineDB(callback){
    return defineBlackBoxDB(callback);
  }

  Blackbox.prototype.syncSession = function syncSession(sessionID){
    function log(msg) {
      console.log(msg);
    }    
    function tendig_random(){
      return Math.floor(1000000000 + Math.random()*9000000000);
    }

    navigator.serviceWorker.register('sw.js').then(function(reg) {
      return reg.sync.getTags();
    }).then(function(tags) {
      if (tags.includes('syncTest:'+tendig_random()+sessionID)) log("There's already a background sync pending");
    }).catch(function(err) {
      log('It broke (probably sync not supported or flag not enabled)');
      log(err.message);
    });

    new Promise(function(resolve, reject) {
      Notification.requestPermission(function(result) {
        if (result !== 'granted') return reject(Error("Denied notification permission"));
        resolve();
      })
    }).then(function() {
      return navigator.serviceWorker.ready;
    }).then(function(reg) {
      return simpleDB.open('sync')
      .then(function(db){
        db.set(sessionID,localStorage.getItem('id_token'));
        reg.sync.register('syncTest:'+tendig_random()+sessionID);
      })       
    }).then(function() {
      log('Sync registered');
    }).catch(function(err) {
      log('It broke');
      log(err.message);
    });

    

  }

  Blackbox.prototype.exportData = function exportData(options){
    var cols;

    if(options.collection === "*"){
      cols = ['telemetry_events'];
    } else {
      cols = [options.collection];
    }

    for(var i in cols){
      options.collection = cols[i];
      if ((!this.idb.isOpen())) {
        this.idb.open()
          .catch(function (error) {
            console.error(error);
          });
        this._exportData(options);
        this.idb.close();
      } else {
        this._exportData(options);
      }
    }

  };

  Blackbox.prototype._exportData = function _exportData(options,callback){
    if (options.collection=='mp4'){
       options.collection='telemetry_events';
       this._exportVideo(options,callback);
       return;
    }

    var fakeClick = function fakeClick(anchorObj) {
      if (anchorObj.click) {
        anchorObj.click();
      } else if (document.createEvent) {
        if (event.target !== anchorObj) {
          var evt = document.createEvent('MouseEvents');
          evt.initMouseEvent('click', true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
          var allowDefault = anchorObj.dispatchEvent(evt);
        }
      }
    };

    var downloadInBrowser = function downloadInBrowser(data,name){
      var blob = new Blob([data], { 'type': 'application/octet-stream' });
      var link = document.createElement("A");
      link.setAttribute('href', window.URL.createObjectURL(blob));
      link.setAttribute('download',name);
      link.setAttribute('target','_blank');
      //download="data.json"
      //link.attr('href', window.URL.createObjectURL(blob));
      document.body.appendChild(link);
      fakeClick(link);
    };

    this.idb[options.collection].where("sessionID").equalsIgnoreCase(options.sessionID).filter(function(item){return item.event!=='x-h264-video.data'}).toArray(function(name,dump){
      var serializedData;
      switch(options.format){
        case 'json': serializedData = JSON.stringify(dump);
        break;
        case 'xml': JSON.stringify(dump); //TODO:
        break;
        case 'csv':
        default: serializedData = new CSV(dump, {header: true}).encode(); //TODO:
      }
      downloadInBrowser(serializedData,name+'-'+options.sessionID+'.'+options.format);
    }.bind(null,options.collection));

  };

  var lastURL = null;
  //TODO: Track this issue preventing easy download of large amounts of data.
  //https://bugs.chromium.org/p/chromium/issues/detail?id=375297
  Blackbox.prototype._exportVideo = function _exportVideo(options,callback){

    var fakeClick = function fakeClick(anchorObj) {
      if (anchorObj.click) {
        anchorObj.click();
      } else if (document.createEvent) {
        if (event.target !== anchorObj) {
          var evt = document.createEvent('MouseEvents');
          evt.initMouseEvent('click', true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
          var allowDefault = anchorObj.dispatchEvent(evt);
        }
      }
    };

    var downloadInBrowser = function downloadInBrowser(data,name){
      if (lastURL!=null){
        URL.revokeObjectURL(lastURL);
        lastURL = null;
      }
      var blob = new Blob([data], { 'type': 'video/mp4' });
      var link = document.createElement("A");
      lastURL = window.URL.createObjectURL(blob);
      link.setAttribute('href', lastURL);
      link.setAttribute('download',name);
      //download="data.json"
      //link.attr('href', window.URL.createObjectURL(blob));
      document.body.appendChild(link);
      fakeClick(link);
    };


    this.idb[options.collection].where("sessionID").equalsIgnoreCase(options.sessionID).filter(function(item){return item.event=='x-h264-video.data'}).toArray(function(name,dump){
        var sizeofData = 0
        var arrayOfData = dump.map(function(item){
          var converted = new Uint8Array(item.data);
          sizeofData+=converted.length;
          return converted;
        });
        var result = new Uint8Array(maxVideoSegmentSize+200000);
        var initFrame=arrayOfData.shift();
        result.set(initFrame,0);
        var tail=initFrame.length;
        var track = 0;
        arrayOfData.forEach(function(item){
          track+=item.length;
          if (Math.ceil(track/maxVideoSegmentSize)==options.segment){
            console.log(tail+item.length);
            result.set(item,tail);
            tail+=item.length;
          }
        });

        downloadInBrowser(result.subarray(0,tail),name+'-'+options.sessionID+'-'+options.segment+'.'+'mp4');
      }.bind(null,options.collection));

  };


  window.Cockpit.plugins.push(Blackbox);

}(window, document, $));
