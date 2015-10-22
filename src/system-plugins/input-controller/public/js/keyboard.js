var inputController = namespace('systemPlugin.inputController');
inputController.Keyboard = function(cockpit) {
  var self = this;
  this.key_tracker = {};
  this.key_tracker_down_count = 0;
  this.key_tracker_map = {};
  self.register = function(control) {
    if (control.bindings.keyboard !== undefined) {
      var key = control.bindings.keyboard;
      if (key !== undefined) {
        //The secondary key essentially puts the system in a secondary mode
        //where new mapping replace the defaults until the primary key is released.

        if (control.down !== undefined) Mousetrap.bind(key, function(){ if (self.key_tracker_down_count>0) return; self.key_tracker[key]='down';self.key_tracker_down_count++; control.down()}, 'keydown');
        if (control.up !== undefined) Mousetrap.bind(key, function(){ self.key_tracker[key]='up';self.key_tracker_down_count--; control.up()}, 'keyup');
        if (control.secondary !== undefined) {
          control.secondary.forEach(function (secondary) {
            if (secondary.down !== undefined) {
              Mousetrap.bind(key + '+' + secondary.bindings.keyboard, function(){if (self.key_tracker[key] === 'down'){ secondary.down()}}, 'keydown');
            }
            if (secondary.up !== undefined)  Mousetrap.bind(key + '+' + secondary.bindings.keyboard, function(){if (self.key_tracker[key] === 'down'){ secondary.up()}}, 'keyup');
          });
        }
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

    if (control.secondary !== undefined) {
      control.secondary.forEach(function (secondary) {
        if (secondary.bindings.keyboard !== undefined) {
          var subKey = key + '+' + secondary.bindings.keyboard;
          Mousetrap.unbind(subKey);
        }
      });
    }
  };


  return self;
};
