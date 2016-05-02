var PREFERENCES = 'plugins:ui-manager';
const path = require('path');
const fs = require('fs');
function UIManager(name, deps) {
  console.log('UI Manager plugin started.');
  var preferences = getPreferences(deps.config);
  this.UIs = [];
  this.deps = deps;
  this.plugin={
    name: 'ui-manager'
  }

}
function getPreferences(config) {
  var preferences = config.preferences.get(PREFERENCES);
  if (preferences === undefined) {
    preferences = {};
    config.preferences.set(PREFERENCES, preferences);
  }
  console.log('Plugin Manager loaded preferences: ' + JSON.stringify(preferences));
  return preferences;
}

UIManager.prototype.start = function start(){
  var self = this;

  /* Crawl the plugins looking for those with settings definitions */
  this.deps.loadedPlugins.forEach(function(plugin){
    if (plugin !== undefined){
      if ((plugin.plugin !== undefined )&& (plugin.plugin.type === "theme")){
        self.UIs.push(plugin);
      }
    }

  });

  var pathInfo = this.deps.pathInfo();

  this.deps.app.get('/', function (req, res) {
    var theme = self.deps.config.preferences.get("plugins:ui-manager").selectedUI;
    theme = theme === undefined ? "new-ui" : theme;
    var scriplets = self.getAppletsByTheme(self.getApplets(),theme);
    //TODO: Add theme to the message so you can differentiate the applets by theme
    //and ignore if it is not the theme you are using.
    //TODO: Look for applet.ejs.disable in a theme to remove the applet option.
    self.deps.cockpit.emit('ui-manager-applets',scriplets.filter(function(item){
      return ['footer','header','head'].indexOf(item.name)==-1;
    }));

    res.render(__dirname +'/base.ejs', {
      title: 'OpenROV ROV Cockpit',
      scripts: pathInfo.scripts,
      styles: pathInfo.styles,
      sysscripts: pathInfo.sysscripts,
      config: self.deps.config,
      scriplets: scriplets
    });
  });


}

UIManager.prototype.getAppletsByTheme = function getAppletsByTheme(applets,theme){
  //This overrides any applet with those in the theme folder
  var result = {};
  applets.base.forEach(function(item){
    result[item.name] = item;
  });
  if (applets[theme] !== undefined){
    applets[theme].forEach(function(item){
      result[item.name] = item;
    });
  }

  return Object.keys(result).map(function (key) {return result[key]});
}

UIManager.prototype.getApplets = function getApplets(){
  var result = {base: []};
  this.deps.loadedPlugins.forEach(function(plugin){
    if ((plugin.plugin !== undefined )&&(plugin.plugin.name=='ui-manager')) {return;}
    if (plugin == undefined){ return;}

    rpath = 'base';
    if ((plugin.plugin !== undefined ) && (plugin.plugin.type === "theme")){
      rpath = plugin.plugin.name;
      if (result[rpath]==undefined){
        result[rpath]=[];
      }
    }
    result[rpath] = result[rpath].concat(plugin._raw.applets.map(function(item){
      console.log('adding: ' + rpath + ': ' +item);
      return {
        name: path.basename(item.path,'.ejs'),
        path: item.path,
        iconMeta: item.icon === undefined? null : fs.readFileSync(item.icon,'utf8').replace(/(\r\n|\n|\r)/gm,"")
      };
    })
    );

  });
  console.log("getApplets")
  console.dir(result);
  return result;

}

UIManager.prototype.getSettingSchema = function getSettingSchema(){
  var UIOptions = [];
  this.deps.loadedPlugins.forEach(function(plugin){
    if (plugin !== undefined){
      if ((plugin.plugin !== undefined )&& (plugin.plugin.type === "theme")){
        UIOptions.push(plugin.plugin.name);
      }
    }

  });

  return [{
	"title": "UI Manager",
	"type": "object",
  "id": "ui-manager", //Added to support namespacing configurations
	"properties": {
		"selectedUI": {
			"type": "string",
      "default": "new-ui",
      "enum": UIOptions //Added default
		}
	},
	"required": ["selectedUI"]
}];
};

module.exports = function (name, deps) {
  return new UIManager(name,deps);
};
