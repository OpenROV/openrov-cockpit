(function (window, $, undefined) {
  'use strict';
  var PluginManager = function PluginManager(cockpit) {
    console.log('Loading Plugin Manager plugin.');
    this.cockpit = cockpit;
    var self = this;
    this.configManager = new window.Plugins.PluginManager.Config();


  };
  //private variables
  var _plugins = null;

  PluginManager.prototype.listen = function listen(){
    var self = this;
    this.cockpit.on('plugin-manager.getControllablePlugins',function(fn){
      if(typeof(fn) === "function"){
        fn(self.EnumerateControllablePlugins());
      }
    });

    this.cockpit.on('plugin-manager.disablePlugin',function(plugin,fn){
      self.disablePlugin(plugin,fn);
    });

    this.cockpit.on('plugin-manager.enablePlugin',function(plugin,fn){
      self.enablePlugin(plugin,fn);
    });


  };

  PluginManager.prototype.enablePlugin = function enablePlugin(plugin,fn){
    this.EnumerateControllablePlugins().forEach(function(p){
      if(p.name === plugin){
        if(p.isEnabled === false){
          p.rawPlugin.enable();
          p.isEnabled = true;
          if (typeof(fn) === 'function'){
            fn();
          }
        }

      }
    });

  };

  PluginManager.prototype.disablePlugin = function disablePlugin(plugin,fn){
    this.EnumerateControllablePlugins().forEach(function(p){
      if(p.name === plugin){
        if(p.isEnabled === true){
          p.rawPlugin.disable();
          p.isEnabled=false;
          if (typeof(fn) === 'function'){
            fn();
          }
        }

      }
    });

  };


  PluginManager.prototype.EnumerateControllablePlugins = function EnumerateControllablePlugins(){
    self = this;
    if (_plugins !== null) return _plugins;
    _plugins= this.cockpit.loadedPlugins
      .filter(function (plugin) {
        console.log('evaluating plugin for pluginmanager');
        if ((plugin.pluginDefaults !== undefined && plugin.pluginDefaults.canBeDisabled)||(plugin.canBeDisabled)) {
          return true;
      }}).map(function(plugin){
        var p = {};
        if (plugin.pluginDefaults!==undefined){
          p = {
              rawPlugin: plugin,
              config: {},
              isEnabled: plugin.pluginDefaults.defaultEnabled !== 'undefined' ? plugin.pluginDefaults.defaultEnabled : true,
              name: plugin.pluginDefaults.name,
              viewName: plugin.pluginDefaults.viewName
          };
        }else{ //support backwards compatibility pre plugin object
          p = {
              rawPlugin: plugin,
              config: {},
              isEnabled: plugin.defaultEnabled !== 'undefined' ? plugin.defaultEnabled : true,
              name: plugin.name,
              viewName: plugin.viewName
          };
        }
        //option to async get additional properies from config here.
        return p;
      });
      return _plugins;
  };

  window.Cockpit.plugins.push(PluginManager);
}(window, jQuery));
