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

  var self=this;

  deps.app.get('/settings', function(req, res) {
    var view =  __filename.substring(0, __filename.lastIndexOf("/")) + '/' + 'settings.ejs';

    var pathInfo = deps.pathInfo();

    res.render( view,
    {
        title: 'OpenROV ROV Settings',
        scripts: pathInfo.scripts,
        styles: pathInfo.styles,
        sysscripts: pathInfo.sysscripts,
        config: deps.config
        } );
    });
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

settingsManager.prototype.loadSettings = function loadSettings(callback){
  //Initialize with the defaults from the schema for settings values
  var _s = _makeSchema(this.schema);
  this.settings = Defaults(_s);

  //Get the settings from nconf for this module
  //and zip them together with the defaults for the final
  //settings.
  this.preferences = getNameSpacedPreferences(this.deps.config);
  objectAssign(this.settings,this.preferences);
//  console.log(JSON.stringify(this.settings));
  for (var key in this.settings) {
    if (this.settings.hasOwnProperty(key)) {
      var result = {}
      result[key]=this.settings[key];
      this.deps.cockpit.emit('settings-change.'+key,result);
      this.deps.globalEventLoop.emit('settings-change.'+key,result);
    }
  }
  this.deps.cockpit.emit('settings-change',this.settings);

  if(typeof(callback)==="function"){
    callback();
  }
}


settingsManager.prototype.start = function start(){
  var self = this;

  /* Crawl the plugins looking for those with settings definitions */
  this.deps.loadedPlugins.forEach(function(plugin){
    var _schema = self.schema;
    var _settings = self.settings;
    if (plugin !== undefined){
      if (plugin.getSettingSchema !== undefined){
        var result = plugin.getSettingSchema();
        if ((result !== undefined) && (Array.isArray(result))){
          result.forEach(function(data){
            if('id' in data){
              _schema[data.id]=data;
            }
          });
        };
      }
    }

  });

  this.loadSettings(function(){self.listen();});

}

settingsManager.prototype.listen = function listen(){

  var self=this;
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
  });

  this.deps.cockpit.on('plugin.settings-manager.getSettings',function(modulename,fn){
    if ((modulename !== undefined) && (modulename !== null)){
      var result = {};
      result[modulename]=self.settings[modulename];
      if (fn!==undefined){
        fn(result);
      };
    } else {
      if (fn!==undefined){
        fn(self.settings)
      }

    }
  })

  this.deps.cockpit.on('plugin.settings-manager.saveSettings',function(settings,fn){
//    self.deps.config.preferences.set(PREFERENCES_NS, settings);
    self.loadSettings(function(){
      for(var item in settings){
        var result = {}
        result[item]=settings[item];
        self.deps.config.preferences.set(PREFERENCES_NS+":"+item, settings[item]);
        self.deps.config.savePreferences();
//        self.deps.cockpit.emit('settings-change.'+item,result);
      };
      self.loadSettings();
//      self.deps.cockpit.emit('settings-change',self.settings);

      if (fn!==undefined && typeof(fn)=='function'){
        fn();
      }
    });
  })
}


//Export provides the public interface
module.exports = function (name, deps) {
  return new settingsManager(name,deps);
};
