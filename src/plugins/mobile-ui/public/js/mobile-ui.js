( function (window, $, undefined) 
{
  'use strict';
  
  console.log( "Loading mobile ui..." );
  
  if (window.openrovtheme!=='mobile-ui')
  	return;
  	
  console.log( "Loaded mobile ui." );
  	
  var plugins = namespace('plugins');
  
  plugins.mobileUi = function mobileUi(cockpit) 
  {
    var jsFileLocation = urlOfJsFile('mobile-ui.js');
    this.cockpit = cockpit;
    this.name = 'mobile-ui';   // for the settings
    this.viewName = 'Mobile UI'; // for the UI
  };

  plugins.mobileUi.prototype.listen = function listen(){
    $('#t')[0]['cockpitEventEmitter'] = this.cockpit;

    window.cockpit_int.i18n.loadNamespace('mobile-ui', function() {  });
    var key_s = window.cockpit_int.i18n.options.keyseparator;
    var ns_s =  window.cockpit_int.i18n.options.nsseparator;
    var prefix = 'mobile-ui';
    $('#t')[0]['__']=function(str){
      window.cockpit_int.i18n.options.ns.defaultNs = prefix
      return window.cockpit_int.__(str);
    };

  }
  window.Cockpit.plugins.push(plugins.mobileUi);
}(window, jQuery));
