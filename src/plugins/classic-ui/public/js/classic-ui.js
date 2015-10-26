(function (window, $) {
  'use strict';
  var plugins = namespace('plugins');

  plugins.classicUi = function ClassicUI() {
    var jsFileLocation = urlOfJsFile('standard.js');

    this.name = 'classic-ui';   // for the settings
    this.viewName = 'Classic UI'; // for the UI

    this.template = '<rov-ui-standard id="UIContainer"></rov-ui-standard>';

    this.loaded = function() {
    };
    this.disable = function () {
    };

  };
  window.Cockpit.UIs.push(plugins.classicUi);
}(window, jQuery));
