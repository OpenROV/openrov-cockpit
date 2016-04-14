var PREFERENCES = 'plugins:ui-manager';
function UIManager(name, deps) {
  console.log('UI Manager plugin started.');
  var preferences = getPreferences(deps.config);
  this.UIs = [];
  this.deps = deps;

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
