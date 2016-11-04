/*jshint esnext:true */
(function (window, document) {

  var hostname = document.location.hostname ? document.location.hostname : 'localhost';
  
  //Cockpit is inheriting from EventEmitter2.
  //http://stackoverflow.com/questions/3900168/how-to-make-a-javascript-singleton-with-a-constructor-without-using-return
  var Cockpit = function Cockpit(csocket) {
    if (Cockpit.instance) {
      alert('intercepted second instance of cockpit');
      return Cockpit.instance;
    }
    Cockpit.instance = this;
    var self = this;
    this.rov = csocket;
    this.storeAndForward = new window.EventEmiiterStoreAndForward(this);
    this.sendUpdateEnabled = true;
    this.loadedPlugins = [];
    this.loadUiTheme(function () {
     // self.loadPlugins();
     // console.log('loaded plugins');
      self.listen();
    });
  };
  Cockpit.prototype = new EventEmitter2();
  Cockpit.prototype.constructor = Cockpit;

  Cockpit.prototype.listen = function listen() {
    var cockpit = this;
  };

  Cockpit.prototype.loadUiTheme = function (done) {
    done();
    return;
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
        if (loadedPlugin.Plugin_Meta !== undefined && loadedPlugin.Plugin_Meta.name == undefined) {
          //This alert should help plugin authurs find they missed a required section for a plugin
          alert('Plugin ' + loadedPlugin + 'has to define a name property!');
        }
        cockpit.loadedPlugins.push(loadedPlugin);
      }
    });
    var plugins_done_loading = false;
    $(document).ready(function (event) {
      console.log('#### What Up ####');
      if (plugins_done_loading)
        return;
      //find a way to unload instead?
      plugins_done_loading = true;
      cockpit.loadedPlugins.forEach(function (plugin) {
        if (plugin.listen !== undefined) {
          plugin.listen();
        }
      });
    });
    Cockpit.plugins = [];
    //flush them out for now. May move to a loaded array if we use in the future
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