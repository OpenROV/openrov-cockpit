(function (window, $, undefined) {
  'use strict';

  var SoftwareUpdater = function SoftwareUpdater(cockpit) {
    var self = this;

    console.log('Loading Software update plugin.');
    this.cockpit = cockpit;

  };

  SoftwareUpdater.prototype.getSettingSchema = function getSettingSchema(){
    return [
      {
          "title": "Update Notification Settings",
          "id" : "software-update-alert",
          "type": "object",
          "properties": {
              "showAlerts": {
                  "type": "boolean",
                  "title": "Show Alert when updates are ready?",
              }
          }
      }
    ]
  }


  window.Cockpit.plugins.push(SoftwareUpdater);

}(window, jQuery));
