var PREFERENCES = 'plugins:ui-manager';
function UIManager(name, deps) {
  console.log('UI Manager plugin started.');
  var preferences = getPreferences(deps.config);

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

UIManager.prototype.getSettingSchema = function getSettingSchema(){
  UIOptions = [];
  UIOptions.push("theme_r2");
  UIOptions.push("new-ui");
  UIOptions.push("standard");


  return [{
	"title": "UI Manager",
	"type": "object",
  "id": "ui-manager", //Added to support namespacing configurations
	"properties": {
		"selectedUI": {
			"type": "string",
      "enum": UIOptions //Added default
		}
	},
	"required": ["selectedUI"]
}];
};

module.exports = function (name, deps) {
  return new UIManager(name,deps);
};
