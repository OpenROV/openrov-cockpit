var PREFERENCES = 'plugins:globalization';


function Globalization(name, deps) {
  console.log('Globalization Finder plugin loaded.');
  var preferences = getPreferences(deps.config);



  deps.app.post('/locales/add/dev/translation', function (req, res) {
    console.log(req.body);
    res.status(200);
    res.end();
  });

  deps.app.get('/locales/dev/translation.json', function (req, res) {
    res.send(JSON.stringify(
      {
        key1: 'value of key 1'
      }
    ));
    res.status(200);
  });


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

module.exports = function (name, deps) {
  return new Globalization(name,deps);
};
