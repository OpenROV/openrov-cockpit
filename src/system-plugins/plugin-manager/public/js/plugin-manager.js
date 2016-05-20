(function (window, $, undefined) {
  'use strict';
  var PluginManager = function PluginManager(cockpit) {
    console.log('Loading Plugin Manager plugin.');
    this.cockpit = cockpit;
    this.rov = cockpit.rov;
    var self = this;

  };
  //private variables
  var _plugins = null;

  var clearPluginCache = function clearPluginCache(){
    _plugins = null;
  };

  PluginManager.prototype.listen = function listen(){
    var self = this;
    this.cockpit.on('plugin-manager.getControllablePlugins',function(fn){
      if(typeof(fn) === "function"){
        self.EnumerateControllablePlugins(fn);
      }
    });

    this.cockpit.on('plugin-manager.disablePlugin',function(plugin,fn){
      self.disablePlugin(plugin,fn);
      self.saveSettings();
    });

    this.cockpit.on('plugin-manager.enablePlugin',function(plugin,fn){
      self.enablePlugin(plugin,fn);
      self.saveSettings();
    });

    this.rov.on('settings-change.pluginmgr', function(settings){
      var that = self;
      clearPluginCache();
      self.EnumerateControllablePlugins(function(plugins){
        that.cockpit.emit('plugin-manager.ControllablePluginsChanged',plugins);
      });
    });

    this.startPlugins();

  };

  PluginManager.prototype.startPlugins = function startPlugins(fn){
    this.EnumerateControllablePlugins(function(items){
      items.forEach(function(p){
        if(p.isEnabled === true){
          p.isEnabled = true;
          p.rawPlugin.isEnabled = true;
          p.rawPlugin.enable();

        } else {
          p.isEnabled = false;
          p.rawPlugin.isEnabled = false;
          p.rawPlugin.disable();

        }
      });
      if (typeof(fn) === 'function'){
        fn();
      }
    });

  };

  PluginManager.prototype.enablePlugin = function enablePlugin(plugin,fn){
    this.EnumerateControllablePlugins(function(items){
      items.forEach(function(p){
        if(p.name === plugin){
          if(p.isEnabled === false){
            p.isEnabled = true;
            p.rawPlugin.isEnabled = true;
            p.rawPlugin.enable();
            if (typeof(fn) === 'function'){
              fn();
            }
          }

        }
      });
    });

  };

  PluginManager.prototype.disablePlugin = function disablePlugin(plugin){
    this.EnumerateControllablePlugins(function(items){
      items.forEach(function(p){
        if(p.name === plugin){
          if(p.isEnabled === true){
            p.isEnabled=false;
            p.rawPlugin.isEnabled = false;
            p.rawPlugin.disable();
            if (typeof(fn) === 'function'){
              fn();
            }
          }

        }
      });
    });
  };

  PluginManager.prototype.saveSettings = function SaveSettings(){
    var self=this;
    this.EnumerateControllablePlugins(function(items){
      var settingsToSave = {};
      items.forEach(function(item){
        var result = {};
        settingsToSave[item.name]={config: item.config, isEnabled: item.isEnabled};
      });
      self.rov.emit('plugin.settings-manager.saveSettings',{pluginmgr : settingsToSave});
    });
  }

  PluginManager.prototype.EnumerateControllablePlugins = function EnumerateControllablePlugins(callback){
    var self = this;
    if (_plugins !== null) {
        callback(_plugins);
        return;
    };
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
      //TODO: zip the server saved config of plugins over the defaults
      this.rov.emit('plugin.settings-manager.getSettings','pluginmgr',function(settings){
        if ('pluginmgr' in settings){
          _plugins.forEach(function(item){
              if (item.name in settings.pluginmgr){
                Object.assign(item,settings.pluginmgr[item.name])
              }
            });
        }
        callback(_plugins);
      });
  };

  window.Cockpit.plugins.push(PluginManager);
}(window, jQuery));
