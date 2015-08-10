(function (window, $, undefined) {
  'use strict';

  var Ui = function StandardUI() {
    var jsFileLocation = urlOfJsFile('standard.js');

    this.name = 'standard-ui';   // for the settings
    this.viewName = 'Standard UI'; // for the UI

    this.polymerTemplateFile = jsFileLocation + '../standard-ui.html';
    this.template = '<rov-ui-standard id="UIContainer"></rov-ui-standard>';

    this.loaded = function() {
      $('#UIContainer')[0].configure(CONFIG);
    };
    this.disable = function () {
    };

  };
  window.Cockpit.UIs.push(new Ui());
}(window, jQuery));
