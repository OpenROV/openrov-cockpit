(function (window, $, undefined) {
  'use strict';
  var plugins = namespace('plugins');
  
  //The __() function will be overridden once the language translation has loaded. For items
  //that load before that, this prevents an error from occuring.  
  var template = $('#t')[0];
  template.__ = function(value){
    console.warn(`'${value}' needed translation before the translation libraries were ready`);
    return value;
  }  
  
  plugins.UIManager = function UIManager(cockpit) {
    this.cockpit = cockpit;
    this.rov = cockpit.rov;
    this.name = 'ui-manager';  // for the settings
  };
  plugins.UIManager.prototype.listen = function listen() {
    var template = $('#t')[0];
    template.addEventListener('dom-change', function () {
      window.dispatchEvent(new Event('resize'));
    });
    template.addEventListener('routedata-changed', function () {
      window.dispatchEvent(new Event('resize'));
    });
    template.cockpitEventEmitter = this.cockpit;
    template.displaySection = function displaySection(item1, item2) {
      return item1 == item2;
    };
    //    template.routedata = {page: 'cockpit'}
    if (window.location.hash == '') {
      window.location.replace('#/cockpit');
      //window.location.replace('#/about');
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
