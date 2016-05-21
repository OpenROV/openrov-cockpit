/*jshint esnext:true */
(function (window, document) {
  // These constants map to the arduino device.h file's constants for capabilities of the ROV
  const LIGHTS_CAPABLE = 1;
  const CALIBRATION_LASERS_CAPABLE = 2;
  const CAMERA_MOUNT_1_AXIS_CAPABLE = 3;
  const COMPASS_CAPABLE = 4;
  const ORIENTATION_CAPABLE = 5;
  const DEPTH_CAPABLE = 6;
  var hostname = document.location.hostname ? document.location.hostname : 'localhost';

  //Cockpit is inheriting from EventEmitter2.
  var Cockpit = function Cockpit(csocket) {
    var self = this;
//    this.uiLoader = new window.UiLoader();

    this.rov = csocket;
    this.storeAndForward = new window.EventEmiiterStoreAndForward(this);
/*    var onevent = csocket.onevent;
    csocket.onevent = function (packet) {
        var args = packet.data || [];
        onevent.call (this, packet);    // original call
        switch(args.length){
          case 1: self.rov.emit(args.shift());      // additional call to catch-all
          break;
          case 2: self.rov.emit(args.shift(),args.shift());      // additional call to catch-all
          break;
          case 3: self.rov.emit(args.shift(),args.shift(),args.shift());
          break;
          case 4: self.rov.emit(args.shift(),args.shift(),args.shift(),args.shift());
          break;
          case 5: self.rov.emit(args.shift(),args.shift(),args.shift(),args.shift(),args.shift());
          break;
          case 6: self.rov.emit(args.shift(),args.shift(),args.shift(),args.shift(),args.shift(),args.shift());
          break;
          case 7: self.rov.emit(args.shift(),args.shift(),args.shift(),args.shift(),args.shift(),args.shift());
          break;
          case 8: self.rov.emit(args.shift(),args.shift(),args.shift(),args.shift(),args.shift(),args.shift(),args.shift());
          break;
          case 9: self.rov.emit(args.shift(),args.shift(),args.shift(),args.shift(),args.shift(),args.shift(),args.shift(),args.shift());
          break;
          case 10: self.rov.emit(args.shift(),args.shift(),args.shift(),args.shift(),args.shift(),args.shift(),args.shift(),args.shift(),args.shift());
          break;


        }
    };
*/
    this.sendUpdateEnabled = true;
    this.capabilities = 0;
    this.loadedPlugins = [];

    this.loadUiTheme(function() {
      self.loadPlugins();
      console.log('loaded plugins');
      // Register the various event handlers
      self.listen();
       /*
      self.extensionPoints = {
        rovSettings: $('html /deep/ rov-settings'),
        rovDiagnostics: $('html /deep/ rov-diagnostics /deep/ #dropIn'),
        videoContainer: $('html /deep/ #video-container1'),
        keyboardInstructions: $('html /deep/ #keyboardInstructions'),
        buttonPanel: $('html /deep/ #buttonPanel'),
        menu: $('html /deep/ rov-menu'),
        inputController: undefined //will be set by the plugin
      };
(
      self.extensionPoints.rovSettings.registerCloseHandler = function(handler) {
        if (self.extensionPoints.rovSettings[0]) {
          self.extensionPoints.rovSettings[0].registerCloseHandler(handler);
        }
       };
      self.extensionPoints.rovDiagnostics.registerCloseHandler = function(handler) {
        if (self.extensionPoints.rovDiagnostics[0]) {
          self.extensionPoints.rovDiagnostics[0].registerCloseHandler(handler);
        }
      };
    */
    });

  };
  Cockpit.prototype = new EventEmitter2();
  Cockpit.prototype.constructor = Cockpit;

  Cockpit.prototype.listen = function listen() {
    var cockpit = this;
    cockpit.rov.on('physicalInterface.rovsys', function (data) {
      console.log('got RovSys update from Arduino');
      if ('capabilities' in data) {
        cockpit.capabilities = data.capabilities;
      }
    });
  };

  Cockpit.prototype.loadUiTheme = function(done) {
    done();
    return;
    /*short circuit */
    var defaultUiName = 'standard-ui'; //temp
    var self = this;
    $.get('plugin/ui-selector', function (config) {
      if (config.selectedUi && config.selectedUi.trim().length > 0) {
        self.uiLoader.load(config.selectedUi, done);
      }
      else {
        self.uiLoader.load(defaultUiName, done);
      }
    }).fail(function() {
      self.uiLoader.load(defaultUiName, done);
    });
  };

  Cockpit.prototype.loadPlugins = function loadPlugins() {
    var cockpit = this;
    Cockpit.plugins.forEach(function (plugin) {
      var loadedPlugin = null;
      try {
        loadedPlugin = new plugin(cockpit);
      } catch (err) {
        console.log('error loading a plugin!!!' + err);
        console.dir(err);
      }
      if (loadedPlugin != null && loadedPlugin !== undefined) {
        if (loadedPlugin.canBeDisabled != undefined) {
          if (loadedPlugin.name == undefined) {
            alert('Plugin ' + loadedPlugin + 'has to define a name property!');
          }
        }
        cockpit.loadedPlugins.push(loadedPlugin);
      }
    });
    var plugins_done_loading = false;
    $(document).ready(function(event) {
      console.log("#### What Up ####");
      if (plugins_done_loading) return; //find a way to unload instead?
      plugins_done_loading = true;
      cockpit.loadedPlugins.forEach(function(plugin){
        if (plugin.listen !== undefined){
          plugin.listen();
        }
      });
    });
/*    setTimeout(function(){ //give a pause for constructor activities before calling listen
      cockpit.loadedPlugins.forEach(function(plugin){
        if (plugin.listen !== undefined){
          plugin.listen();
        }
      });
    },1000);
*/

    Cockpit.plugins = [];  //flush them out for now. May move to a loaded array if we use in the future
    cockpit.rov.emit('cockpit.pluginsLoaded');
  };
  Cockpit.prototype.addPlugin = function addPlugin(plugin) {
    var cockpit = this;
    Cockpit.plugins.push(plugin);
    new plugin(cockpit);
  };
  // Static array containing all plugins to load
  Cockpit.plugins = [];
  Cockpit.UIs = [];
  window.Cockpit = Cockpit;

}(window, document));
