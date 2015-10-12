var Defaults=require('json-schema-defaults');
var objectAssign = require('object-assign'); //polyfill
var PREFERENCES_NS="plugins"
//Modele, everything private by default
var settingsManager = function settingsManager(name, deps) {
  console.log('The settings-manager plugin.');

  //state variables
  this.deps = deps;
  this.schema = {};
  this.settings = {};
  this.preferences = getNameSpacedPreferences(deps.config);
}

//Private functions

var _makeSchema = function(schemaArray){
  var s = {
    "title": "OpenROV Settings",
    "type": "object",
    "properties" : {}
  };
  for(var i in schemaArray){
    s.properties[i] = schemaArray[i];
  }
  return s;
};

var getNameSpacedPreferences = function getNameSpacedPreferences(config) {
  var preferences = config.preferences.get(PREFERENCES_NS);
  if (preferences === undefined) {
    preferences = {};
    config.preferences.set(PREFERENCES_NS, preferences);
  }
  console.log('Plugin Manager loaded preferences: ' + JSON.stringify(preferences));
  return preferences;
}

//Public Functions

settingsManager.prototype.start = function start(){
  var self = this;

  //Wireup event listeners
  this.deps.rov.on('status', function (status) {
  });

  this.deps.cockpit.on('callibrate_escs', function () {
  });

  this.deps.cockpit.on('plugin.settings-manager.getSchemas',function(fn){

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

  this.deps.cockpit.on('plugin.settings-manager.getSettings',function(modulename,fn){
    if ((modulename !== undefined) && (modulename !== null)){
      var result = {};
      result[modulename]=self.settings[modulename];
      if (fn!==undefined){
        fn(result);
      };
      self.deps.cockpit.emit('settings-change.'+modulename,result);
    } else {
      if (fn!==undefined){
        fn(self.settings)
      }
      self.deps.cockpit.emit('settings-change',self.settings);
    }
  })

  this.deps.cockpit.on('plugin.settings-manager.saveSettings',function(settings,fn){
    self.deps.config.preferences.set(PREFERENCES_NS, settings);
    self.deps.config.savePreferences();
    for(var item in settings){
      var result = {}
      result[item]=settings[item];
      self.deps.cockpit.emit('settings-change.'+item,result);
    };

    if (fn!==undefined){
      fn();
    }
  })


  /* Crawl the plugins looking for those with settings definitions */
  this.deps.loadedPlugins.forEach(function(plugin){
    var _schema = self.schema;
    var _settings = self.settings;
    if (plugin.getSettingSchema !== undefined){
      plugin.getSettingSchema().forEach(function(data){
        if('id' in data){
          _schema[data.id]=data;
        }
      });
    }

  });

  //Initialize with the defaults from the schema for settings values
  var _s = _makeSchema(self.schema);
  this.settings = Defaults(_s);

  //Get the settings from nconf for this module
  //and zip them together with the defaults for the final
  //settings.

  objectAssign(this.settings,this.preferences);
//  console.log(JSON.stringify(this.settings));


}



//Export provides the public interface
module.exports = function (name, deps) {
  return new settingsManager(name,deps);
};
