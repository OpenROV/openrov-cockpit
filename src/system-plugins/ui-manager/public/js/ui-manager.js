(function (window, $, undefined) {
  'use strict';
  var plugins = namespace('plugins');
  plugins.UIManager = function UIManager(cockpit) {
    this.cockpit = cockpit;
    this.rov = cockpit.rov;
    this.name = 'ui-manager';  // for the settings
  };
  plugins.UIManager.prototype.listen = function listen() {
    var template = $('#t')[0];
    template.addEventListener('dom-change', function () {
      console.log('boom');
      window.dispatchEvent(new Event('resize'));
    });
    template.addEventListener('routedata-changed', function () {
      console.log('scriplet change');
      window.dispatchEvent(new Event('resize'));
    });
    template.cockpitEventEmitter = this.cockpit;
    template.displaySection = function displaySection(item1, item2) {
      return item1 == item2;
    };
    //    template.routedata = {page: 'cockpit'}
    if (window.location.hash == '') {
     // window.location.replace('#/cockpit');
      window.location.replace('#/about');
    }
    this.registerEventListeners(this.cockpit, this.rov);    

  };
  var register = [];
  plugins.UIManager.prototype.registerEventListeners = function registerEventListeners(cockpit, rov) {
    register.forEach(function (fn) {
      fn();
    });
    register = [];
    var handleAppletMsg = function (applets) {
      cockpit.emit('ui-manager-applets', applets);
    };
    rov.withHistory.on('ui-manager-applets', handleAppletMsg);
    register.push(rov.off.bind(this, 'ui-manager-applets', handleAppletMsg));
  };
  window.Cockpit.plugins.push(plugins.UIManager);
}(window, jQuery));