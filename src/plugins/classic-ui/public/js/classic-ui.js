(function (window, $) {
  'use strict';
  if (window.openrovtheme !== 'classic-ui')
    return;
  var plugins = namespace('plugins');
  plugins.classicUi = function ClassicUI(cockpit) {
    var jsFileLocation = urlOfJsFile('standard.js');
    this.name = 'classic-ui';
    // for the settings
    this.viewName = 'Classic UI';
    // for the UI
    this.cockpit = cockpit;
    this.template = '<rov-ui-standard id="UIContainer"></rov-ui-standard>';
    this.loaded = function () {
    };
    this.disable = function () {
    };
  };
  plugins.classicUi.prototype.listen = function listen() {
    if (!window.cockpit_int) {
      setTimeout(function () {
        self.listen.call(self);
      }, 100);
      return;
    }
    $('#t')[0].cockpitEventEmitter = this.cockpit;
    window.cockpit_int.i18n.loadNamespace('classic-ui', function () {
    });
    var key_s = window.cockpit_int.i18n.options.keyseparator;
    var ns_s = window.cockpit_int.i18n.options.nsseparator;
    var prefix = 'classic-ui';
    $('#t')[0].__ = function (str) {
      window.cockpit_int.i18n.options.ns.defaultNs = prefix;
      return window.cockpit_int.__(str);
    };
  };
  window.Cockpit.plugins.push(plugins.classicUi);
}(window, jQuery));