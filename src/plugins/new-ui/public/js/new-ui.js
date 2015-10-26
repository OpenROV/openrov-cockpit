(function (window, $, undefined) {
  'use strict';
  var plugins = namespace('plugins');
  plugins.NewUI = function NewUI(cockpit) {
    var jsFileLocation = urlOfJsFile('new-ui.js');

    this.name = 'new-ui';   // for the settings
    this.viewName = 'New UI'; // for the UI
  };

  plugins.NewUI.prototype.inputDefaults = function inputDefaults(){
    var self = this;
    return [{
      name: 'newUi.showTelemetry',
      description: 'Show the telemetry window.',
      defaults: { keyboard: 'alt+t' },
      down: function () {
        var telemetryWindow = window.open('new-ui/telemetry', '__telemetry', 'menubar=no, status=no, titlebar=no, toolbar=no, width=300, height=400, location=no');
        telemetryWindow.cockpit = window.cockpit;
      }
    },
    {
      name: 'newUi.showSerialMonitor',
      description: 'Show the serial port window.',
      defaults: { keyboard: 'alt+s' },
      down: function () {
        var serialWindow = window.open('new-ui/serial-monitor', '__serial-monitor', 'menubar=no, status=no, titlebar=no, toolbar=no, width=300, height=400, location=no');
        serialWindow.cockpit = window.cockpit;
      }
    }
    ];
  };
  window.Cockpit.plugins.push(plugins.NewUI);

}(window, jQuery));
