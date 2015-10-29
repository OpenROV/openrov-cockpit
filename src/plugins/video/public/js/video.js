(function (window, document, jQuery) { //The function wrapper prevents leaking variables to global space
  'use strict';


  var Video;

  //These lines register the Video object in a plugin namespace that makes
  //referencing the plugin easier when debugging.
  var plugins = namespace('plugins');
  plugins.Video = Video;

  Video = function Video(cockpit) {

    console.log('Loading video plugin in the browser.');

    //instance variables
    this.cockpit = cockpit;
    this.rov = cockpit.rov;

    // for plugin management:
    this.pluginDefaults = {
      name : 'video',   // for the settings
      viewName : 'Video plugin', // for the UI
      canBeDisabled : false, //allow enable/disable
      defaultEnabled: true
   };

  };

  //listen gets called by the plugin framework after all of the plugins
  //have loaded.
  Video.prototype.listen = function listen() {
    var self=this;


    this.cockpit.on("plugin.video.video-clicked",function(){
      alert('Video plugin.\nThere will be a message sent to the ROV in 5 seconds.');
      setTimeout(function() {
        cockpit.rov.emit('plugin.video.foo');
      }, 5000);
    });

  };

  Video.prototype.inputDefaults = function inputDefaults(){
    var self = this;
    return [{
      name: 'video.keyBoardMapping',
      description: 'Video for keymapping.',
      defaults: { keyboard: 'alt+0', gamepad: 'X' },
      down: function() { console.log('0 down'); },
      up: function() { console.log('0 up'); },
      secondary: [
        {
          name: 'video.keyBoardMappingDepdent',
          dependency: 'video.keyBoardMapping',
          defaults: { keyboard: '9', gamepad: 'RB' },
          down: function() { console.log('####'); }
        }
      ]
    },
      {
        name: 'video.testMessage',
        description: 'another video',
        defaults: { keyboard: 'alt+T' },
        down: function() {
          showMessageFoo = true;
          showMessageBar = true;
          self.cockpit.rov.emit('plugin.video.video_to_foo', 'abc'); }
      }]
  };

  window.Cockpit.plugins.push(Video);

}(window, document, $));
