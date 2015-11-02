(function (window, document, jQuery) {
  'use strict';
  var plugins = namespace('plugins');


  var Blackbox = function Blackbox(cockpit) {
    console.log('Loading Blackbox plugin.');
    this.cockpit = cockpit;
    this.recording = false;
    this.idb;

    this.idb = this.defineDB(); //Readies the DB, ensures schema is consistent
    this.idb.on('error', function (err) {
        // Catch all uncatched DB-related errors and exceptions
        console.error(err);
    });
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

    this.cockpit.on('plugin-blackbox-export', function(options){
      self.exportData(options);
    });

    this.cockpit.on('plugin-blackbox-recording-start', function(){
      self.startRecording();
    });

    this.cockpit.on('plugin-blackbox-recording-stop', function(){
      self.stopRecording();
    });

    this.cockpit.on('plugin-blackbox-recording?', function(fn){
      if(typeof(fn) === 'function'){
        fn(self.recording);
      }
    });


  };

  Blackbox.prototype.toggleRecording = function toggleRecording() {
    if (this.recording){
      this.stopRecording();
    } else {
      this.startRecording();
    }
  };

  Blackbox.prototype.startRecording = function startRecording() {
    if (!this.recording) {
      console.log('Recording Telemetry');
      var blackbox = this;
      this.idb.open();
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

  Blackbox.prototype.logNavData = function logNavData(navdata) {
    if (!this.recording) {
      return;
    }
    navdata.timestamp = Date.now();
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
    this.idb.telemetry.add(statusdata)
      .catch(function (error) {
        console.error(error);
      });
  };

  Blackbox.prototype.defineDB = function defineDB(callback){
    //Instructions to upgrade: https://github.com/dfahlander/Dexie.js/wiki/Design
    var idb = new Dexie("openrov-blackbox2");
    idb.version(1).stores({
        navdata: 'timestamp',
        telemetry: 'timestamp',
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
      if (!this.recording) {
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

    this.idb[options.collection].toArray(function(name,dump){
      var serializedData;
      switch(options.format){
        case 'json': serializedData = JSON.stringify(dump);
        break;
        case 'xml': JSON.stringify(dump); //TODO:
        break;
        case 'csv':
        default: serializedData = new CSV(dump, {header: true}).encode(); //TODO:
      }
      downloadInBrowser(serializedData,name+'.'+options.format);
    }.bind(null,options.collection));

  };

  window.Cockpit.plugins.push(Blackbox);

}(window, document, $));
