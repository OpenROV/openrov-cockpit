var PREFERENCES = 'plugins:software-update';
function softwareUpdate(name, deps) {
  deps.logger.debug('Software update plugin started.');
  var preferences = getPreferences(deps.config);
  showSerialScript = __dirname + '/scripts/' + (process.env.USE_MOCK === 'true' ? 'mock-' : '') + 'showserial.sh';
  deps.app.get('system-plugin/software-update/config', function (req, res) {
    res.send(preferences);
  });
  deps.app.get('system-plugin/software-update/config/dashboardUrl', function (req, res) {
    res.send({ url: deps.config.dashboardURL });
  });
  deps.app.get('system-plugin/software-update/config/showAlerts', function (req, res) {
    res.send(preferences.showAlerts);
  });
  deps.app.post('system-plugin/software-update/config/showAlerts', function (req, res) {
    preferences.showAlerts = req.body;
    deps.config.preferences.set(PREFERENCES, preferences);
    deps.config.savePreferences();
    res.status(200);
    res.send(preferences.showAlerts);
  });
  
  deps.globalEventLoop.on("plugin.updateManager.status",function(status){
    deps.cockpit.emit("plugin.updateManager.status",status)
  })

  deps.globalEventLoop.on("plugin.updateManager.log",function(log){
    deps.cockpit.emit("plugin.updateManager.log",log)
  })

  deps.globalEventLoop.on("plugin.updateManager.error",function(error){
    deps.cockpit.emit("plugin.updateManager.error",error)
  })      
  
  deps.cockpit.on("mcu.UpdateFirmware",function(){
    deps.globalEventLoop.emit("mcu.UpdateFirmware");
  });
  
  deps.cockpit.on("mcu.RebuildMCUFirmware",function(){
    deps.globalEventLoop.emit("mcu.RebuildMCUFirmware");
  });  
  
  deps.cockpit.on("mcu.FlashESCs",function(){
    deps.globalEventLoop.emit("mcu.FlashESCs");
  });

  deps.cockpit.on("mcu.ResetMCU",function(){
    deps.globalEventLoop.emit("mcu.ResetMCU");
  });

  
}
function getPreferences(config) {
  var preferences = config.preferences.get(PREFERENCES);
  if (preferences === undefined) {
    preferences = { showAlerts: { showAlerts: true } };
    config.preferences.set(PREFERENCES, preferences);
  }
  return preferences;
}
module.exports = function (name, deps) {
  return new softwareUpdate(name, deps);
};