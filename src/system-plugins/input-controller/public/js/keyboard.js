//  <script type="text/javascript" src="components/mousetrap/mousetrap.js"></script> <!--for gamepad-abstraction -->
$.getScript('components/mousetrap-js/mousetrap.js');
var inputController = namespace('systemPlugin.inputController');
inputController.Keyboard = function(cockpit) {
  var self = this;
  self.register = function(control) {
    if (!Mousetrap){
      setTimeout(self.register.bind(this),500);
      return;
    }
    if (control.bindings.keyboard !== undefined) {
      var key = control.bindings.keyboard;
      if (key !== undefined) {
        if (control.down !== undefined) Mousetrap.bind(key, function(){ control.down(); return false}, 'keydown');
        if (control.up !== undefined) Mousetrap.bind(key, function(){ control.up(); return false;}, 'keyup');
      }
    }
  };

  self.reset = function () {
    Mousetrap.reset();
  };

  self.unregister = function(control) {
    var key = control.bindings.keyboard;
    if (key !== undefined) {
      Mousetrap.unbind(key);
    }
  };


  return self;
};
