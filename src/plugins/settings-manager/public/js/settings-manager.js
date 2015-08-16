(function (window, $, undefined) {
  'use strict';
  var SettingsManager;
  SettingsManager = function SettingsManager(cockpit) {
    console.log('Loading SettingsManager plugin in the browser.');
    // Instance variables
    this.cockpit = cockpit;
    this.settings = {};
    this.schema = {};
  };
  //This pattern will hook events in the cockpit and pull them all back
  //so that the reference to this instance is available for further processing
  SettingsManager.prototype.listen = function listen() {
    var self = this;

    /* Crawl the plugins looking for those with settings definitions */
    self.cockpit.loadedPlugins.forEach(function(plugin){
      var _schema = self.schema;
      if (plugin.getSettingSchema !== undefined){
        plugin.getSettingSchema().forEach(function(data){
          if('id' in data){
            _schema[data.id]=data;
          }
        });
      }
    });

    self.cockpit.on('plugin.settings-manager.persist-data',function(data,callback){
      console.log(data);
      //todo: pass upstream

    });

    self.cockpit.on('plugin.settings-manager.getSchemas',function(fn){
      var s = {
        "title": "OpenROV Settings",
        "type": "object",
        "properties" : {}
      };
      for(var i in self.schema){
        s.properties[i] = self.schema[i];
      }
      fn(s);
    })

    self.cockpit.on('plugin.settings-manager.getSettings',function(fn){

      fn(self.settings);
    })



  };
  window.Cockpit.plugins.push(SettingsManager);
}(window, jQuery));
