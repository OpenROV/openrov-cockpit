//  <script type="text/javascript" src="components/mousetrap/mousetrap.js"></script> <!--for gamepad-abstraction -->
loadScript('components/mousetrap-js/mousetrap.js');

var inputController = namespace('systemPlugin.inputController');
inputController.Keyboard = function (cockpit) {
  var self = this;

  stopCallback = function (e, element) {
    // if the element has the class "mousetrap" then no need to stop
    if ((' ' + element.className + ' ').indexOf(' mousetrap ') > -1) {
      console.log('moustrap');
      return false;
    }
    // stop for input, select, and textarea
    if (element.tagName == 'INPUT' || element.tagName == 'SELECT' || element.tagName == 'TEXTAREA' || element.contentEditable && element.contentEditable == 'true') {
      console.log('moustrap:tag');
      return true;
    }
    console.log('moustrap:default');
    return false;
  };

  self.register = function (control) {
    if (typeof Mousetrap == 'undefined') {
      setTimeout(self.register.bind(this, control), 500);
      return;
    }
    if (Mousetrap.modified == undefined) {
      var orgStopCalback = Mousetrap.prototype.stopCallback;
      Mousetrap.prototype.stopCallback = function (e, element, combo, sequence) {
        if ((' ' + element.className + ' ').indexOf(' no-mousetrap ') > -1) {
          console.log('nomoustrap');
          return true;
        }
        return orgStopCalback.call(this, e, element, combo, sequence);
      };
      Mousetrap.modified = true;
    }
    if (control.bindings.keyboard !== undefined) {
      var key = control.bindings.keyboard;
      if (key !== undefined) {
        if (control.down !== undefined)
          Mousetrap.bind(key, function () {
            control.down();
            return false;
          }, 'keydown');
        if (control.up !== undefined)
          Mousetrap.bind(key, function () {
            control.up();
            return false;
          }, 'keyup');
      }
    }
  };

  self.reset = function () {
    Mousetrap.reset();
  };

  self.unregister = function (control) {
    var key = control.bindings.keyboard;
    if (key !== undefined) {
      Mousetrap.unbind(key);
    }
  };
  
  return self;
};