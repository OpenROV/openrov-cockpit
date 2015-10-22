var PREFERENCES = 'plugins:globalization';


function Globalization(name, deps) {
  console.log('Globalization Finder plugin loaded.');
  var preferences = getPreferences(deps.config);
  this.deps = deps;

};


function getPreferences(config) {
  var preferences = config.preferences.get(PREFERENCES);
  if (preferences === undefined) {
    preferences = {};
    config.preferences.set(PREFERENCES, preferences);
  }
  console.log('Plugin Finder loaded preferences: ' + JSON.stringify(preferences));
  return preferences;
}

Globalization.prototype.getSettingSchema = function getSettingSchema(){
  var availableLocals = [];
  this.deps.loadedPlugins.forEach(function(plugin){
    if (plugin !== undefined){
      if (plugin.lang !== undefined){
        availableLocals.push(plugin.lang);
      }
    }

  });

  return [{
	"title": "Globalization",
	"type": "object",
  "id": "globalization", //Added to support namespacing configurations
	"properties": {
		"selectedLocal": {
			"type": "string",
      "default": "en-US",
      "enum": availableLocals //Added default
		}
	},
	"required": ["selectedLocal"]
}];
};


module.exports = function (name, deps) {
  return new Globalization(name,deps);
};
