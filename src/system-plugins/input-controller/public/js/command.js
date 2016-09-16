var inputController = namespace('systemPlugin.inputController');
inputController.Command = function (control) {
  if (control instanceof inputController.Command) {
    return control;
  }
  var self = this;
  if (control.name === undefined || control.name.constructor != String || control.name.trim().length === 0) {
    alert('The passed InputController command does not have a valid string as property \'name\'!\n' + 'Object: ' + JSON.stringify(control));
  } else {
    self.name = control.name;
  }

  self.replaced = [];
  self.description = control.description || self.name;
  if (control.down !== undefined)
    self.down = control.down;
  if (control.up !== undefined)
    self.up = control.up;
  if (control.axis !== undefined)
    self.axis = control.axis;
  self.defaults = control.defaults;
  if ( control.bindings ) {
      self.bindings = control.bindings;
  }
  else {
      self.bindings = control.defaults;
  }

  self.active = control.active !== undefined ? control.active : true;
  return this;
};
inputController.Command.prototype.down = function () {
};
inputController.Command.prototype.up = function () {
};
inputController.Command.prototype.axis = function (v) {
};
