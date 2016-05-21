(function (window, document, jQuery) { //The function wrapper prevents leaking variables to global space
  'use strict';


  var Example;

  //These lines register the Example object in a plugin namespace that makes
  //referencing the plugin easier when debugging.
  var plugins = namespace('plugins');
  plugins.Exammple = Example;

  Example = function Example(cockpit) {

    console.log('Loading example plugin in the browser.');

    //instance variables
    this.cockpit = cockpit;
    this.rov = cockpit.rov;

    // for plugin management:
    this.pluginDefaults = {
      name : 'example',   // for the settings
      viewName : 'Example plugin', // for the UI
      canBeDisabled : true, //allow enable/disable
      defaultEnabled: true
   };

  };

  //private functions and variables (hidden within the function, available via the closure)

  var _name='';
  var getAttributes=function getAttributes(){
    return {
      name:_name
    }
  }

  //Adding the public methods using prototype simply groups those methods
  //together outside the parent function definition for easier readability.

  //Called by the plugin-manager to enable a plugin
  Example.prototype.enable = function enable() {
    console.log('example enabled');
  };

  //Called by the plugin-manager to disable a plugin
  Example.prototype.disable = function disable() {
    console.log('example disabled');
  };


  //listen gets called by the plugin framework after all of the plugins
  //have loaded.
  Example.prototype.listen = function listen() {
    var self=this;
    //Wire up plugin.example.namechanged to get sent
    //when the settings first and last name options get
    //changed

    var updateAttributesFromSettings = function(settings){
      var first = settings.example.firstName;
      var last = settings.example.lastName;

      //This Name is the closure variable that is private
      _name = first+' '+last;
      self.cockpit.emit('plugin.example.attributes-changed',getAttributes());
      console.log('Emitted plugin.example.attributes-changed');
    }

    //Response from the getSettings call. Using the withHistory will call the
    //update function with the last copy of this message that had been sent.
    //The settings manager sends a change message for each section when
    //first read in.
    this.rov.withHistory.on('settings-change.example',function(settings){
     updateAttributesFromSettings(settings);
    });

    this.cockpit.on("plugin.example.example-clicked",function(){
      alert('Example plugin.\nThere will be a message sent to the ROV in 5 seconds.');
      setTimeout(function() {
        cockpit.rov.emit('plugin.example.foo');
      }, 5000);
    });


    this.cockpit.rov.on('plugin.example.message', function(message) {
      alert(message);
    });

    var showMessageFoo = true;
    this.cockpit.rov.on('plugin.example.example_foo', function(data) {
      if (showMessageFoo) {
        showMessageFoo = false;
        alert('Message from arduino "example_foo": ' + data);
        cockpit.rov.emit('plugin.example.example_to_bar', 'foobar');
      }
    });

    var showMessageBar = true;
    this.cockpit.rov.on('plugin.example.example_bar', function(data) {
      if (showMessageBar) {
        showMessageBar = false;
        alert('Message from arduino "example_bar": ' + data);
      }
    });




  };

  Example.prototype.inputDefaults = function inputDefaults(){
    var self = this;
    return [{
      name: 'example.keyBoardMapping',
      description: 'Example for keymapping.',
      defaults: { keyboard: 'alt+0', gamepad: 'X' },
      down: function() { console.log('0 down'); },
      up: function() { console.log('0 up'); },
      secondary: [
        {
          name: 'example.keyBoardMappingDepdent',
          dependency: 'example.keyBoardMapping',
          defaults: { keyboard: '9', gamepad: 'RB' },
          down: function() { console.log('####'); }
        }
      ]
    },
      {
        name: 'example.testMessage',
        description: 'another example',
        defaults: { keyboard: 'alt+T' },
        down: function() {
          showMessageFoo = true;
          showMessageBar = true;
          self.cockpit.rov.emit('plugin.example.example_to_foo', 'abc'); }
      }]
  };

  //headsUpMenuItems is called by the headsup-menu plugin if present.
  Example.prototype.altMenuDefaults = function altMenuDefaults(){
    //TODO: Need to cleanup the interface to the alt-menu
    var self = this;
    var item = {
      label: 'Example menu',
      callback: function () {
        alert('example menu item from heads up menu');
        item.label(self.label() + ' Foo Bar');
      }
    };
    return item;
  }

  window.Cockpit.plugins.push(Example);

}(window, document, $));
