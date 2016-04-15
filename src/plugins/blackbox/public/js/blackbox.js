(function (window, document, jQuery) {
  'use strict';
  var plugins = namespace('plugins');
  //jQuery.getScript('/components/dexie/dist/latest/Dexie.js');

  var head = document.getElementsByTagName("head")[0];
  var js = document.createElement("script");
  js.type = "text/javascript";
  js.src = '/components/dexie/dist/latest/Dexie.js';
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

    if (window.Dexie===undefined){
//      $.getScript('/components/dexie/dist/latest/Dexie.js',function(){
//        self.listen();
//      });
      setTimeout(function(){self.listen()},1000);
      return;
    }
    this.idb = this.defineDB(); //Readies the DB, ensures schema is consistent
    this.idb.on('error', function (err) {
        // Catch all uncatched DB-related errors and exceptions
        console.error(err);
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
      self.exportVideo(options);
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
      callback(data);
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
      });
    }
  };

  Blackbox.prototype.logNavData = function logNavData(navdata) {
    if (!this.recording) {
      return;
    }
    navdata.timestamp = Date.now();
    navdata.sessionID= this.sessionID;
    this.idb.navdata.add(navdata)
      .catch(function (error) {
        console.error(error);
      });
  };

  Blackbox.prototype.logStatusData = function logStatusData(statusdata) {
    if (!this.recording) {
      return;
    }
    statusdata.timestamp = Date.now();
    statusdata.sessionID= this.sessionID;
    this.idb.telemetry.add(statusdata)
      .catch(function (error) {
        console.error(error);
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

  Blackbox.prototype.exportVideo = function exportVideo(options){
    var cols;

//    if(options.collection === "*"){
      cols = ['mp4'];
//    } else {
//      cols = [options.collection];
//    }

    for(var i in cols){
      options.collection = cols[i];
      if (!this.idb.isOpen()) {
        this.idb.open()
          .catch(function (error) {
            console.error(error);
          });
        this._exportVideo(options);
        this.idb.close();
      } else {
        this._exportVideo(options);
      }
    }

  };

  Blackbox.prototype._exportData = function _exportData(options,callback){

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
      var blob = new Blob([data], { 'type': 'video/mp4' });
      var link = document.createElement("A");
      link.setAttribute('href', window.URL.createObjectURL(blob));
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
      var tail = 0;
      arrayOfData.forEach(function(item){
        result.set(item,tail);
        tail+=item.length;
      });


//      var result = Uint8Array.of.apply(this,arrayOfData);
/*


      var bufferlength=0;
      var dataArray = dump.reduce(function(previous,current,index,array){
        var b = new Uint8Array(current.data);
        //var c = new Uint8Array(previous.length + b.length);
        //c.set(previous);
        if (bufferlength+b.length>previous.length){
          var c =
        }
        previous.set(b, bufferlength);
        bufferlength+=b.length
        return c;
      },new Uint8Array(2000000));
*/
      downloadInBrowser(result,name+'-'+options.sessionID+'.'+'mp4');
    }.bind(null,options.collection));

  };


  window.Cockpit.plugins.push(Blackbox);

}(window, document, $));
