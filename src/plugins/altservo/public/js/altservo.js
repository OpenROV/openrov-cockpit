$( document ).ready(function() {
  'use strict';

  window.altServo = this;


  var AltServo;
  AltServo = function AltServo(cockpit) {
    this._enabled = true;
    this._servoPosition = 0;

    console.log('Loading altservo plugin in the browser.');

    // Instance variables
    this.cockpit = cockpit;
    // Add required UI elements
    var self=this;
    this.cockpit.emit('inputController.register',
     [ {
        name: "altservo.servoup",
        description: "Increase servo.",
        defaults: { keyboard: 'alt+q'},
        down: function() { 
	    self._servoPosition+=.10;
	    if (self._servoPosition>1) self._servoPosition=1;
            self.cockpit.socket.emit('altservo_set',self._servoPosition);
	  }
        },
        {
        name: "altservo.servodown",
        description: "Increase servo.",
        defaults: { keyboard: 'alt+z'},
        down: function() {
            self._servoPosition-=.10;
            if (self._servoPosition<-1) self._servoPosition=-1;
            self.cockpit.socket.emit('altservo_set',self._servoPosition);
	   }
        } ]
      ); 

    // :for plugin management:
    this.name = 'altServo';   // for the settings
    this.viewName = 'AltServo plugin'; // for the UI
    this.canBeDisabled = true; //allow enable/disable
    this.enable = function () {
      this._enabled = true;
    };
    this.disable = function () {
      this._enabled = false;
    };
  };

  AltServo.prototype.listen = function listen() {
    var rov = this;
  };
  window.Cockpit.plugins.push(AltServo);
});
