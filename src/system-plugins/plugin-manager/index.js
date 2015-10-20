var PREFERENCES = 'plugins:plugin-manager';
function pluginManager(name, deps) {
  console.log('Pugin Manager plugin started.');
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
module.exports = pluginManager;
