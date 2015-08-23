(function (window, $, undefined) {
  'use strict';
  var PluginManager = function PluginManager(cockpit) {
    console.log('Loading Plugin Manager plugin.');
    this.cockpit = cockpit;
    var self = this;
    this.configManager = new window.Plugins.PluginManager.Config();

  };

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
          if (typeof(fn) === 'function'){
            fn();
          }
        }

      }
    });

  };


  PluginManager.prototype.EnumerateControllablePlugins = function EnumerateControllablePlugins(){
    self = this;
    return this.cockpit.loadedPlugins
      .filter(function (plugin) {
        console.log('evaluating plugin for pluginmanager');
        if (plugin.canBeDisabled) {
          return true;
      }}).map(function(plugin){
        var p = {
            rawPlugin: plugin,
            config: {},
            isEnabled: plugin.defaultEnabled !== 'undefined' ? plugin.defaultEnabled : true,
            name: plugin.name,
            viewName: plugin.viewName
        };
        //option to async get additional properies from config here.
        return p;
      });
  };

  window.Cockpit.plugins.push(PluginManager);
}(window, jQuery));
