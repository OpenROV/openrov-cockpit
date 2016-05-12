(function (window, document, jQuery) {
  'use strict';
  var plugins = namespace('plugins');
  const maxVideoSegmentSize = 200000000;

  //jQuery.getScript('/components/dexie/dist/latest/Dexie.js');

  var head = document.getElementsByTagName("head")[0];
  var js = document.createElement("script");
  js.type = "text/javascript";
  js.src = 'components/dexie/dist/latest/Dexie.js';
  head.appendChild(js);

  var js = document.createElement("script");
  js.type = "text/javascript";
  js.src = 'components/comma-separated-values/csv.min.js';
  head.appendChild(js);

  var Blackbox = function Blackbox(cockpit) {
    console.log('Loading Blackbox plugin.');
    this.cockpit = cockpit;
    this.recording = false;
    this.idb;
    this.sessionID = this.newSession();

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
    this.idb = this.defineDB(); //Readies the DB, ensures schema is consistent
    this.idb.on('error', function (err) {
        // Catch all uncatched DB-related errors and exceptions
        console.error(err.message);
        console.dir(err);
    });

    this.cockpit.rov.on('plugin.navigationData.data', function (data) {
      if (!jQuery.isEmptyObject(data)) {
        self.logNavData(data);
      }
    });
    this.cockpit.withHistory.on('status', function (data) {
      if (!jQuery.isEmptyObject(data)) {
        self.logStatusData(data);
      }
    });
    this.cockpit.on('x-h264-video.data', function (data) {
        self.logMP4Video(data);
    });
    this.cockpit.on('plugin-blackbox-export', function(options){
      self.exportData(options);
    });

    this.cockpit.on('plugin-blackbox-recording-start', function(){
      self.startRecording();
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
        idb.mp4.where("sessionID").equalsIgnoreCase(data[i].sessionID).toArray(function(j,dump){
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
    if (!this.idb.isOpen()) {
      this.idb.open()
        .catch(function (error) {
          console.error(error);
        });
      _recordedSessions(this.idb,callback);
      this.idb.close();
    } else {
      _recordedSessions(this.idb,callback);
    }

  }

  Blackbox.prototype.toggleRecording = function toggleRecording() {
    if (this.recording){
      this.stopRecording();
    } else {
      this.startRecording();
    }
  };

  Blackbox.prototype.startRecording = function startRecording() {
    if (!this.recording) {
      var self=this;
      console.log('Recording Telemetry');
      var blackbox = this;
      this.idb.open();
      if(!sessionIDRecorded){
        this.idb.sessions.add({sessionID:this.sessionID,timestamp:Date.now()});
        this.recordedSessions(function(sessions){
          self.cockpit.emit('plugin-blackbox-sessions',sessions)
        });
        sessionIDRecorded=true;
      }
      this.recording = true;
      this.cockpit.emit('plugin-blackbox-recording-status',true);
    }
  };

  Blackbox.prototype.stopRecording = function stopRecording() {
    if (this.recording) {
      console.log('Stopping Telemetry');
      this.recording = false;
      this.idb.close();
      this.cockpit.emit('plugin-blackbox-recording-status',false);
    }
  };
  var initFrame=null;

  window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder ||
                       window.MozBlobBuilder;

  Blackbox.prototype.logMP4Video = function logMP4Video(data) {
    var self=this;
    if (!this.recording) {
      return;
    }
    if (initFrame==null){
      this.cockpit.emit('request_Init_Segment', function(init) {
        initFrame=init;
        self.logMP4Video.call(self,init);
      });
    } else {
    //var myblob = new Blob([data]);
    this.idb.mp4.add({timestamp: Date.now(),sessionID:this.sessionID,data:data})
      .catch(function (error) {
        console.error(error);
        self.stopRecording();
      });
    }
  };

  Blackbox.prototype.logNavData = function logNavData(navdata) {
    var self=this;
    if (!this.recording) {
      return;
    }
    navdata.timestamp = Date.now();
    navdata.sessionID= this.sessionID;
    this.idb.navdata.add(navdata)
      .catch(function (error) {
        console.error(error);
        self.stopRecording();
      });
  };

  Blackbox.prototype.logStatusData = function logStatusData(statusdata) {
    var self=this;
    if (!this.recording) {
      return;
    }
    statusdata.timestamp = Date.now();
    statusdata.sessionID= this.sessionID;
    this.idb.telemetry.add(statusdata)
      .catch(function (error) {
        console.error(error);
        self.stopRecording();
      });
  };

  Blackbox.prototype.defineDB = function defineDB(callback){
    //Instructions to upgrade: https://github.com/dfahlander/Dexie.js/wiki/Design
    var idb = new Dexie("openrov-blackbox2");
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

  Blackbox.prototype.exportData = function exportData(options){
    var cols;

    if(options.collection === "*"){
      cols = ['navdata','telemetry'];
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

    this.idb[options.collection].where("sessionID").equalsIgnoreCase(options.sessionID).toArray(function(name,dump){
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


    this.idb[options.collection].where("sessionID").equalsIgnoreCase(options.sessionID).toArray(function(name,dump){
      var sizeofData = 0
      var arrayOfData = dump.map(function(item){
        var converted = new Uint8Array(item.data);
        sizeofData+=converted.length;
        return converted;
      });
      var result = new Uint8Array(sizeofData);
      var initFrame=arrayOfData.shift();
      result.set(initFrame,0);
      var tail=initFrame.length;
      var track = 0;
      arrayOfData.forEach(function(item){
        track+=item.length;
        if (Math.ceil(track/maxVideoSegmentSize)==options.segment){
          result.set(item,tail);
          tail+=item.length;
        }
      });

      downloadInBrowser(result,name+'-'+options.sessionID+'-'+options.segment+'.'+'mp4');
    }.bind(null,options.collection));

  };


  window.Cockpit.plugins.push(Blackbox);

}(window, document, $));
