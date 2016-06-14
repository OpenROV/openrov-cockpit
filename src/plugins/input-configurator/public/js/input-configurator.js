/*jshint multistr: true*/
(function (window, $, undefined) {
  'use strict';
  var InputConfigurator;
  InputConfigurator = function InputConfigurator(cockpit) {
    console.log('Loading Motor_diags plugin in the browser.');
    // Instance variables
    this.cockpit = cockpit;
    // Add required UI elements
    var self = this;

    // var jsFileLocation = urlOfJsFile('input-configurator.js');
    // // the js folder path
    // this.cockpit.extensionPoints.rovSettings.find('#inputConfigurator').load(jsFileLocation + '../settings.html', function () {
    //   self.cockpit.extensionPoints.rovSettings.find('#inputConfigurator').find('button#show').click(function() {
    //     $('body').find('#inputConfiguratorDialogContainer')  
    //       .find('#inputConfiguratorDialog').modal('show');
    //     self.cockpit.extensionPoints.inputController.suspend();
    //     $('body').find('#inputConfiguratorDialogContainer')  
    //       .find('#inputConfiguratorDialog').on('hidden.bs.modal', function (e) {
    //         self.cockpit.extensionPoints.inputController.resume();
    //       })
    //   })
    //   $('body').find('#inputConfiguratorDialogContainer')
    //     .load(jsFileLocation + '../configuratorDialog.html', function () {
    //     });
    // });

  };

  InputConfigurator.prototype.LoadSettings = function LoadSettings(settings) {
    debugger;
  };
  InputConfigurator.prototype.SaveSettings = function() {
  };
  
  InputConfigurator.prototype.listen = function listen() {
    var self=this;
    self.cockpit.on('plugin.inputConfigurator.currentMap.update', function(newMap) {
      self.cockpit.rov.emit('plugin.settings-manager.saveSettings', {inputConfigurator: {currentMap: newMap}})
    });  
  };
  
  window.Cockpit.plugins.push(InputConfigurator);
}(window, jQuery));
