$( document ).ready(function() {
  'use strict';

  window.lightsPlugin = this;

  var Lights;

  Lights = function lights(cockpit) {

    console.log('Loading lights plugin in the browser.');

    //private variables
    this.intensity = 0;
    var self = this;
    // Instance variables
    this.cockpit = cockpit;
    // Add required UI elements

    //$('#navtoolbar').append('<ul id="lightindicators"><li id="internal_lights_indicator" class="level10" ></li><li id="external_lights_indicator" class="level10" ></li></ul>');

    this.cockpit.emit('inputController.register',
      [
      {
        name: "lights.keyBoardMapping",
        description: "lights for keymapping.",
        defaults: { keyboard: 'alt+i' },
        down: function() {
          var target = 0;
          if (self.intensity === 0) target = 1;
          self.setLights(target);
         }
        },
      {
        name: "lights.keyBoardMapping",
        description: "lights for keymapping.",
        defaults: { keyboard: 'alt+p' },
        down: function() {
          self.setLights(self.intensity+.1);
        }
      },
      {
        name: "lights.keyBoardMapping",
        description: "lights for keymapping.",
        defaults: { keyboard: 'alt+o' },
        down: function() { self.setLights(self.intensity-.1); }
      }
      ]
    );

    // for plugin management:
    this.name = 'lights';   // for the settings
    this.viewName = 'lights plugin'; // for the UI
    this.canBeDisabled = true; //allow enable/disable
    this.enable = function () {
      alert('lights enabled');
    };
    this.disable = function () {
      alert('lights disabled');
    };
  };

  Lights.prototype.listen = function listen() {
    var rov = this;

    var injectorInterval =
    setInterval(function(){
      if ($('#brightnessIndicator').length > 0){

        $('#brightnessIndicator')
        .replaceWith('<li id="lightindicators"><div id="internal_lights_indicator" class="level0" /><div id="external_lights_indicator" class="level0"/ ></li>');

        clearInterval(injectorInterval);
      }
      },500
    );

    this.cockpit.socket.on('status', function (data) {
      if ('LIGP' in data)
        $('#internal_lights_indicator').attr( "class", "level" + Math.ceil(data.LIGP * 10));
      if ('LIGPE' in data)
        $('#external_lights_indicator').attr( "class", "level" + Math.ceil(data.LIGPE * 10));
    });

    var item = [{
      label: ko.observable("ext lights off"),
      callback: function () {
        rov.setLights(0);
      }
    },
    {
      label: ko.observable("ext lights 50%"),
      callback: function () {
        rov.setLights(.50);
      }
    },
    {
      label: ko.observable("ext lights full"),
      callback: function () {
        rov.setLights(1);
      }
    }
    ];
    rov.cockpit.emit('headsUpMenu.register', item);

  };
  Lights.prototype.setLights = function setLights(value) {
    this.intensity = value;
    if (this.intensity > 1)
      this.intensity = 1;
    if (this.intensity < 0)
      this.intensity = 0;
    this.cockpit.socket.emit('lights.set_external_lights_power', this.intensity);
  };
  window.Cockpit.plugins.push(Lights);
});
