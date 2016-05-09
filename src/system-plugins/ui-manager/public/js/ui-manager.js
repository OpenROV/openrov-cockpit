(function (window, $, undefined) {
  'use strict';
  var plugins = namespace('plugins');
  plugins.UIManager = function UIManager(cockpit) {

    this.cockpit = cockpit;
    this.rov = cockpit.rov;
    this.name = 'ui-manager';   // for the settings
  };

  plugins.UIManager.prototype.listen = function listen(){
    var template = $('#t')[0];
    template.addEventListener('dom-change', function() {
      console.log('boom');
    });

    template.addEventListener('scriplet-changed', function() {
      console.log('scriplet change');
    });

    template['cockpitEventEmitter'] = this.cockpit;
    template.displaySection= function displaySection(item1,item2){
      return item1==item2;
    }
    template.routedata = {page: 'cockpit'}
//    if ((window.location.pathname=="/") && (window.location.hash=='')){
//      window.location.replace ('#/cockpit');
//    }


    this.rov.withHistory.on('ui-manager-applets',function(applets){
      self.cockpit.emit('ui-manager-applets',applets);
    });

  }

  window.Cockpit.plugins.push(plugins.UIManager);
}(window, jQuery));
