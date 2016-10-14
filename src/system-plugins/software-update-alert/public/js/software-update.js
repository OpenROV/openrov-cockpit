(function (window, $, undefined) {
  'use strict';
  var SoftwareUpdater = function SoftwareUpdater(cockpit) {
    var self = this;
    console.log('Loading Software update plugin.');
    this.cockpit = cockpit;

    this.cockpit.rov.withHistory.on("plugin.updateManager.status",function(status){
      self.cockpit.emit("plugin.updateManager.status",status);
    })

    this.cockpit.rov.on("plugin.updateManager.log",function(log){
      self.cockpit.emit("plugin.updateManager.log",log);
    })

    this.cockpit.rov.on("plugin.updateManager.error",function(error){
      self.cockpit.emit("plugin.updateManager.error",error);
    })

    this.cockpit.on("plugin.updateManager.retry",function(){
      self.cockpit.rov.emit("mcu.UpdateFirmware");
    })

  };
  SoftwareUpdater.prototype.getSettingSchema = function getSettingSchema() {
    return [{
        'title': 'Update Notification Settings',
        'id': 'software-update-alert',
        'type': 'object',
        'properties': {
          'showAlerts': {
            'type': 'boolean',
            'title': 'Show Alert when updates are ready?'
          }
        }
      }];
  };
  window.Cockpit.plugins.push(SoftwareUpdater);
}(window, jQuery));