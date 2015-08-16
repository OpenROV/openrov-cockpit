function settingsManager(name, deps) {
  console.log('The settings-manager plugin.');

  deps.rov.on('status', function (status) {
  });

  deps.cockpit.on('callibrate_escs', function () {
  });

}
module.exports = settingsManager;
