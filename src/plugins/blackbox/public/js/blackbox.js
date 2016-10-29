(function (window, document, jQuery) {
  'use strict';
  var plugins = namespace('plugins');
  const maxVideoSegmentSize = 200000000;
  //jQuery.getScript('/components/dexie/dist/latest/Dexie.js');
  var head = document.getElementsByTagName('head')[0];
  var js = document.createElement('script');
  js.type = 'text/javascript';
  js.src = 'components/dexie/dist/dexie.min.js';
  head.appendChild(js);
  var js = document.createElement('script');
  js.type = 'text/javascript';
  js.src = 'components/comma-separated-values/csv.min.js';
  head.appendChild(js);
  var js = document.createElement('script');
  js.type = 'text/javascript';
  js.src = 'plugin/blackbox/js/lib/idb.js';
  head.appendChild(js);
  var js = document.createElement('script');
  js.type = 'text/javascript';
  js.src = 'js/simpledb.js';
  head.appendChild(js);
  var Blackbox = function Blackbox(cockpit) {
    console.log('Loading Blackbox plugin.');
    var self = this;

    this.cockpit = cockpit;
    this.recording = false;
    this.idb;
    this.sessionID = this.newSession();
    this.eventBuffer = [];
    this.otherBuffer = [];
    this.sessions_cache = [];

    this.inputDefaults = [
    {
      name: 'blackbox.record',
      description: 'Start recording the telemetry data.',
      controllers: new Map([["keyboard", "r"]]),
      actions:
      {
        down: function() {
          self.toggleRecording();
        }
      }
    }];

    //If this was loaded after the input manager, let it know we are ready to be loaded
    cockpit.emit('plugin.inputController.defaults', self.inputDefaults);
  };

  plugins.Blackbox = Blackbox;

  Blackbox.prototype.listen = function listen() {
    var self = this;
    if (window.Dexie === undefined || window.CSV === undefined) {
      //      $.getScript('/components/dexie/dist/latest/Dexie.js',function(){
      //        self.listen();
      //      });
      setTimeout(function () {
        self.listen();
      }, 1000);
      return;
    }
    this.idb = this.defineDB(function (idb) {
      self.cockpit.emit('blackbox-dixie-object', idb);
    });
    //Readies the DB, ensures schema is consistent
    this.idb.on('error', function (err) {
      // Catch all uncatched DB-related errors and exceptions
      console.error(err.message);
      console.dir(err);
      self.stopRecording();
    });
    this.idb.open().catch(function (err) {
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
        'plugin-blackbox-sessions'
      ];
    this.cockpit.onAny(function () {
      if (OnAnyBlacklist.includes(this.event)) {
        return;
      }
      if (this.event !== 'newListener') {
        var args = new Array(arguments.length);
        for (var i = 0; i < args.length; ++i) {
          //i is always valid index in the arguments object
          args[i] = arguments[i];
        }
        self.logOtherData(this.event, args);
      }
    });
    this.cockpit.rov.on('plugin.navigationData.data', function (data) {
      if (!jQuery.isEmptyObject(data)) {
        self.logEventData('plugin.navigationData.data', data);
      }
    });
    this.cockpit.on('plugin.gps.data', function (data) {
      if (!jQuery.isEmptyObject(data)) {
        self.logEventData('plugin.gps.data', data);
      }
    });
    this.cockpit.withHistory.on('status', function (data) {
      if (!jQuery.isEmptyObject(data)) {
        self.logEventData('status', data);
      }
    });
    this.cockpit.on('x-h264-video.data', function (data) {
      //TODO: Will generalize to pass all video events from all
      //cameras that are choosen for recording
      self.logMP4Video('x-h264-video.data', data);
    });
    this.cockpit.on('plugin-blackbox-export', function (options) {
      self.exportData(options);
    });
    this.cockpit.on('plugin-blackbox-recording-start', function () {
      self.startRecording();
    });
    this.cockpit.on('plugin-blackbox-sync-session', function (sessionID) {
      self.syncSession(sessionID);
    });
    this.cockpit.on('plugin-blackbox-delete-session', function (sessionID) {
      self.deleteSession(sessionID);
    });
    this.cockpit.on('plugin-blackbox-recording-stop', function () {
      self.stopRecording();
    });
    this.cockpit.on('plugin-blackbox-get-sessions', function (callback) {
      self.recordedSessions(callback);
    });
    this.cockpit.on('plugin-blackbox-recording?', function (fn) {
      if (typeof fn === 'function') {
        fn(self.recording);
      }
    });
    this.recordedSessions(function (sessions) {
      self.cockpit.emit('plugin-blackbox-sessions', sessions);
    });
    setInterval(function () {
      var sessions = self.sessions_cache;
      //plugin-blackbox-sync-sessions
      var session_ids = sessions.map(function (item) {
          return item.sessionID;
        });
      simpleDB.open('sync').then(function (db) {
        return db.getMany(session_ids);
      }).then(function (syncSessions) {
        if (Object.keys(syncSessions).length > 0) {
          self.cockpit.emit('plugin-blackbox-sync-sessions', syncSessions);
        }
      });
    }, 15000);
  };
  var sessionIDRecorded = false;
  Blackbox.prototype.newSession = function newSession() {
    return generateUUID();
  };
  //TODO: Add sessions collection that each unique session is placed
  var _recordedSessions = function _recordedSessions(idb, callback) {
    idb.sessions.toArray(function (data) {
      callback(data);
    });
  };
  //Assume recording sessions end with browsers closing, when returning the sessions, check if there is cleanup work that needs to be performed
  //since the recording is complete.
  Blackbox.prototype.recordedSessions = function recordedSessions(callback) {
    var self = this;
    _recordedSessions(this.idb, function (data) {
      var sessionsTofix = [];
      data.forEach(function (session) {
        if (self.sessionID == session.sessionID) {
          return;
        }
        var fixes = [];
        //fix for data from before sessions
        if (session.sessionID == null) {
          session.sessionID = '';
        }
        if (session.duration == undefined) {
          fixes.push(firstTelemetryItem(self.idb, session.sessionID).then(function (firstItem) {
            return lastTelemetryItem(self.idb, session.sessionID).then(function (lastItem) {
              if (lastItem==null){return;}
              session.duration = lastItem.timestamp - firstItem.timestamp;
              return;
            });
          }));
        }
        if (session.VideoSegments == undefined) {
          fixes.push(new Promise(function (resolve, reject) {
            self.idb.telemetry_events.where('sessionID').equalsIgnoreCase(session.sessionID).filter(function (item) {
              return item.event == 'x-h264-video.data';
            }).toArray(function (dump) {
              var sizeofData = 0;
              var arrayOfData = dump.map(function (item) {
                  var converted = new Uint8Array(item.data);
                  sizeofData += converted.length;
                  return {
                    length: converted.length,
                    id: item.id,
                    timestamp: item.timestamp
                  };
                });
              if (arrayOfData.length == 0) {
                session.VideoSegments = [];
                session.videoSize = 0;
                resolve();
                return;
              }
              var VideoSegments = [];
              var initFrame = arrayOfData.shift();
              var segmentsize = initFrame.length;
              var framecount = 0;
              var startFrame = arrayOfData[0];
              while (arrayOfData.length > 0) {
                var item = arrayOfData.shift();
                segmentsize += item.length;
                if (arrayOfData.length == 0 || segmentsize + arrayOfData[0].length > maxVideoSegmentSize) {
                  VideoSegments.push({
                    start_id: startFrame.id,
                    stop_id: item.id,
                    length: segmentsize,
                    frames: framecount,
                    start_time: startFrame.timestamp,
                    stop_time: item.timestamp
                  });
                  segmentsize = initFrame.length;
                  startFrame = arrayOfData[0];
                  framecount = 0;
                }
              }
              session.VideoSegments = VideoSegments;
              session.videoSize = sizeofData;
              resolve();
            });
          }));
        }
        if (fixes.length > 0) {
          var result = Promise.resolve();
          fixes.forEach(task => {
              result = result.then(function(){return task});
         })
          result.then(function () {
            self.idb.sessions.put(session);
          });
          sessionsTofix.push(result);
        }
      });
      if (sessionsTofix.length > 0) {
        var result = Promise.resolve();
        sessionsTofix.forEach(task => {
            result = result.then(function(){return task});
        })
        result.then(function () {
          console.log('Cleaned up data session information');
          self.sessions_cache = data;
          callback(data);
        });
      } else {
        self.sessions_cache = data;
        callback(data);
      }
    });
  };
  Blackbox.prototype.toggleRecording = function toggleRecording() {
    if (this.recording) {
      this.stopRecording();
    } else {
      this.startRecording();
    }
  };
  function formatBytes(bytes, decimals) {
    if (bytes == 0)
      return '0 Byte';
    var k = 1000;
    // or 1024 for binary
    var dm = decimals + 1 || 3;
    var sizes = [
        'Bytes',
        'KB',
        'MB',
        'GB',
        'TB',
        'PB',
        'EB',
        'ZB',
        'YB'
      ];
    var i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
  Blackbox.prototype.startRecording = function startRecording() {
    if (this.recording) {
      return;
    }
    var self = this;
    console.log('Recording Telemetry');
    var blackbox = this;
    var commitBuffers = function () {
      self.idb.transaction('rw', self.idb.telemetry_events, self.idb.otherdata, function () {
        while (self.eventBuffer.length > 0) {
          self.idb.telemetry_events.add(self.eventBuffer.shift());
        }
        while (self.otherBuffer.length > 0) {
          self.idb.otherdata.add(self.otherBuffer.shift());
        }
      }).then(function () {
      }).catch(function (error) {
        console.error(error);
        self.stopRecording();
      });
      if (self.recording || (self.eventBuffer.length > 0 || self.otherBuffer.length > 0)) {
        setTimeout(commitBuffers.bind(self), 1000);
        navigator.webkitTemporaryStorage.queryUsageAndQuota(function (usedBytes, grantedBytes) {
          console.log('we are using ', formatBytes(usedBytes, 2), ' of ', formatBytes(grantedBytes, 2), ' ', formatBytes(grantedBytes - usedBytes, 2), ' remaining.');
        }, function (e) {
          console.log('Error', e);
        });
      }
    };
    //Create the session
    this.idb.open().then(function () {
      if (!sessionIDRecorded) {
        self.idb.sessions.add({
          sessionID: self.sessionID,
          timestamp: Date.now()
        });
        self.recordedSessions(function (sessions) {
          self.cockpit.emit('plugin-blackbox-sessions', sessions);
        });
        sessionIDRecorded = true;
      }
      self.recording = true;
      self.cockpit.emit('plugin-blackbox-recording-status', true);
      commitBuffers.call(self);
    }).catch(function (err) {
      throw new Error(err);
    });
  };
  Blackbox.prototype.stopRecording = function stopRecording() {
    if (this.recording) {
      console.log('Stopping Telemetry');
      this.recording = false;
      this.cockpit.emit('plugin-blackbox-recording-status', false);
    }
  };
  var initFrame = null;
  window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder;
  Blackbox.prototype.logMP4Video = function logMP4Video(event, data) {
    var self = this;
    if (!this.recording) {
      return;
    }
    if (initFrame == null) {
      this.cockpit.emit('request_Init_Segment', function (init) {
        initFrame = init;
        self.logMP4Video.call(self, event, init);
      });
    } else {
      this.eventBuffer.push({
        timestamp: Date.now(),
        sessionID: this.sessionID,
        event: event,
        data: data
      });
    }
  };
  Blackbox.prototype.logEventData = function logEventData(event, data) {
    var self = this;
    if (!this.recording) {
      return;
    }
    var eventData = {
        timestamp: Date.now(),
        sessionID: this.sessionID,
        event: event,
        data: data
      };
    this.eventBuffer.push(eventData);
  };
  Blackbox.prototype.logOtherData = function logOtherData(event, data) {
    var self = this;
    if (!this.recording) {
      return;
    }
    var otherdata = {
        event: event,
        data: JSON.stringify(data)
      };
    otherdata.timestamp = Date.now();
    otherdata.sessionID = this.sessionID;
    this.otherBuffer.push(otherdata);
  };
  Blackbox.prototype.defineDB = function defineDB(callback) {
    return defineBlackBoxDB(callback);
  };
  Blackbox.prototype.deleteSession = function deleteSession(sessionID) {
    var self = this;
    this.idb.telemetry_events.where('sessionID').equalsIgnoreCase(sessionID).delete().then(function () {
      return self.idb.sessions.where('sessionID').equalsIgnoreCase(sessionID).delete();
    }).then(function () {
      self.recordedSessions(function (sessions) {
        self.cockpit.emit('plugin-blackbox-sessions', sessions);
      });
    });
  };
  Blackbox.prototype.syncSession = function syncSession(sessionID) {
    function log(msg) {
      console.log(msg);
    }
    function tendig_random() {
      return Math.floor(1000000000 + Math.random() * 9000000000);
    }
    navigator.serviceWorker.register('sw.js').then(function (reg) {
      return reg.sync.getTags();
    }).then(function (tags) {
      if (tags.includes('syncTest:' + tendig_random() + sessionID))
        log('There\'s already a background sync pending');
    }).catch(function (err) {
      log('It broke (probably sync not supported or flag not enabled)');
      log(err.message);
    });
    new Promise(function (resolve, reject) {
      Notification.requestPermission(function (result) {
        if (result !== 'granted')
          return reject(Error('Denied notification permission'));
        resolve();
      });
    }).then(function () {
      return navigator.serviceWorker.ready;
    }).then(function (reg) {
      return simpleDB.open('sync').then(function (db) {
        db.set(sessionID, {
          id_token: localStorage.getItem('id_token'),
          profile: localStorage.getItem('id_profile')
        });
        reg.sync.register('sync-session:' + tendig_random() + ':' + sessionID);
      });
    }).then(function () {
      log('Sync registered');
    }).catch(function (err) {
      log('It broke');
      log(err.message);
    });
  };
  Blackbox.prototype.exportData = function exportData(options) {
    var cols;
    if (options.collection === '*') {
      cols = ['telemetry_events'];
    } else {
      cols = [options.collection];
    }
    for (var i in cols) {
      options.collection = cols[i];
      if (!this.idb.isOpen()) {
        this.idb.open().catch(function (error) {
          console.error(error);
        });
        this._exportData(options);
        this.idb.close();
      } else {
        this._exportData(options);
      }
    }
  };
  Blackbox.prototype._exportData = function _exportData(options, callback) {
    if (options.collection == 'mp4') {
      options.collection = 'telemetry_events';
      this._exportVideo(options, callback);
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
    var downloadInBrowser = function downloadInBrowser(data, name) {
      var blob = new Blob([data], { 'type': 'application/octet-stream' });
      var link = document.createElement('A');
      link.setAttribute('href', window.URL.createObjectURL(blob));
      link.setAttribute('download', name);
      link.setAttribute('target', '_blank');
      //download="data.json"
      //link.attr('href', window.URL.createObjectURL(blob));
      document.body.appendChild(link);
      fakeClick(link);
    };
    this.idb[options.collection].where('sessionID').equalsIgnoreCase(options.sessionID).filter(function (item) {
      return item.event !== 'x-h264-video.data';
    }).toArray(function (name, dump) {
      var serializedData;
      switch (options.format) {
      case 'json':
        serializedData = JSON.stringify(dump);
        break;
      case 'xml':
        JSON.stringify(dump);
        //TODO:
        break;
      case 'csv':
      default:
        serializedData = new CSV(dump, { header: true }).encode();  //TODO:
      }
      downloadInBrowser(serializedData, name + '-' + options.sessionID + '.' + options.format);
    }.bind(null, options.collection));
  };
  var lastURL = null;
  //TODO: Track this issue preventing easy download of large amounts of data.
  //https://bugs.chromium.org/p/chromium/issues/detail?id=375297
  Blackbox.prototype._exportVideo = function _exportVideo(options, callback) {
    var self = this;
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
    var downloadInBrowser = function downloadInBrowser(data, name) {
      if (lastURL != null) {
        URL.revokeObjectURL(lastURL);
        lastURL = null;
      }
      var blob = new Blob([data], { 'type': 'video/mp4' });
      var link = document.createElement('A');
      lastURL = window.URL.createObjectURL(blob);
      link.setAttribute('href', lastURL);
      link.setAttribute('download', name);
      //download="data.json"
      //link.attr('href', window.URL.createObjectURL(blob));
      document.body.appendChild(link);
      fakeClick(link);
    };
    var initFrame;
    var session_record;
    this.idb.telemetry_events.where('sessionID').equals(options.sessionID).filter(function (item) {
      return item.event == 'x-h264-video.data';
    }).first().then(function (init_frame) {
      initFrame = init_frame;
      return self.idb.sessions.where('sessionID').equals(options.sessionID).first();
    }).then(function (session) {
      session_record = session;
      var sort = 0;
      return self.idb.telemetry_events.where('id').between(session.VideoSegments[options.segment - 1].start_id, session.VideoSegments[options.segment - 1].stop_id, true, true).filter(function (item) {
        if (sort > item.id) {
          console.log('OUT OF ORDER MP4 FRAMES');
        }
        sort = item.id;
        return item.event == 'x-h264-video.data' && item.sessionID == session.sessionID;
      }).toArray();
    }).then(function (result) {
      result.unshift(initFrame);
      var segmentSize = session_record.VideoSegments[options.segment - 1].length;
      var videoSegmenent = new Uint8Array(segmentSize);
      var tail = 0;
      result.forEach(function (item) {
        var uint8data = new Uint8Array(item.data);
        if (uint8data.byteLength + tail >= segmentSize) {
          console.log('cannot get here');  //assert.false('woops');
        }
        videoSegmenent.set(uint8data, tail);
        tail += uint8data.byteLength;
      });
      downloadInBrowser(videoSegmenent, 'mp4-' + options.sessionID + '-' + options.segment + '.' + 'mp4');
    }).catch(function (err) {
      throw err;
    });
  };
  window.Cockpit.plugins.push(Blackbox);
}(window, document, $));
