(function (window, document, jQuery) { //The function wrapper prevents leaking variables to global space
  'use strict';


  var DiveProfile;

  //These lines register the Example object in a plugin namespace that makes
  //referencing the plugin easier when debugging.
  var plugins = namespace('plugins');
  plugins.DiveProfile = DiveProfile;

  DiveProfile = function DiveProfile(cockpit) {

    console.log('Loading DiveProfile plugin in the browser.');

    //instance variables
    this.cockpit = cockpit;
    this.rov = cockpit.rov;

    // for plugin management:
    this.pluginDefaults = {
      name : 'diveprofile',   // for the settings
      viewName : 'DiveProfile plugin', // for the UI
      canBeDisabled : false, //allow enable/disable
      defaultEnabled: true
   };

  };

  //private functions and variables (hidden within the function, available via the closure)

  //listen gets called by the plugin framework after all of the plugins
  //have loaded.
  DiveProfile.prototype.listen = function listen() {
    var self=this;
    //Wire up plugin.example.namechanged to get sent
    //when the settings first and last name options get
    //changed

    this.rov.withHistory.on('settings-change.diveprofile',function(settings){
      self.cockpit.emit('plugin.diveprofile.watertype',{watertype:settings.diveprofile['water-type']});
    });
    
    this.rov.withHistory.on('plugin.diveprofile.watertype', function(watertype){
        self.cockpit.emit('plugin.diveprofile.watertype',watertype);
    });




  };


  window.Cockpit.plugins.push(DiveProfile);

}(window, document, $));
