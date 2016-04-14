
(function(window,$) {
  'use strict';
//  var i8ln = require('i18next');
  var plugins = namespace('plugins');

    $.getScript('components/i18next/i18next-latest.js',function(){
      //http://i18next.com/pages/doc_init.html
      if (window.cockpit_int !== undefined) return;
      i18n.init({
        lng: "en-US",
        sendMissing: true,
        resPostPath: 'locales/add/__lng__/__ns__',
        sendMissingTo: 'current',
        nsseparator : ':::',
        keyseparator : '::',
        load: "current",
        fallbackLng: "en-US"
      }, function(err, t) {
        window.cockpit_int = {};
        window.cockpit_int.__=i18n.t;
        window.cockpit_int.i18n = i18n;
        var test = window.cockpit_int.__('This is a test');
        console.log(test);
        });
        // programatical access
    //      var appName = t("app.name");
      });

  plugins.Globalization = function(cockpit) {
    var self = this;
    self.cockpit = cockpit;
    self.rov = cockpit.rov;
    console.log("Globalization Plugin running");


  };


  //This pattern will hook events in the cockpit and pull them all back
  //so that the reference to this instance is available for further processing
  plugins.Globalization.prototype.listen = function listen() {
    var self = this;

    var changeLanguage =  function changeLanguage(settings){
      var lang = settings.selectedLocal;
      if (lang!==undefined){
        window.cockpit_int.i18n.setLng(lang);
      }
    };
    //Get the preferred language from settings
    self.cockpit.emit('plugin.settings-manager.getSettings','globalization',changeLanguage);

    self.rov.on('settings-change.globalization',changeLanguage);
  };

  window.Cockpit.plugins.push(plugins.Globalization);

})(window,$);
