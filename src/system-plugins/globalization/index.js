var PREFERENCES = 'plugins:globalization';
var logger;
function Globalization(name, deps) {
  deps.logger.debug('Globalization Finder plugin loaded.');
  var preferences = getPreferences(deps.config);
  this.deps = deps;
  logger = this.deps.logger;
}
function getPreferences(config) {
  var preferences = config.preferences.get(PREFERENCES);
  if (preferences === undefined) {
    preferences = {};
    config.preferences.set(PREFERENCES, preferences);
  }
  return preferences;
}
Globalization.prototype.getSettingSchema = function getSettingSchema() {
  var availableLocals = [];
  this.deps.loadedPlugins.forEach(function (plugin) {
    if (plugin !== undefined) {
      if (plugin.lang !== undefined) {
        availableLocals.push(plugin.lang);
      }
    }
  });
  return [{
      'title': 'Language',
      'category': 'ui',
      'description': 'Settings for localization',
      'type': 'object',
      'id': 'globalization',
      'properties': {
        'selectedLocal': {
          'type': 'string',
          'default': 'en-US',
          'enum': availableLocals
        }
      },
      'required': ['selectedLocal']
    }];
};
module.exports = function (name, deps) {
  return new Globalization(name, deps);
};