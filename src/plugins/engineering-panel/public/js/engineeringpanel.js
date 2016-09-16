(function (window, document, jQuery) {
  'use strict';
  var engineering;
  var plugins = namespace('plugins');
  plugins.engineering = engineering;
  engineering = function engineering(cockpit) {
    console.log('Loading Engineering plugin in the browser.');
    this.cockpit = cockpit;
    this.rov = cockpit.rov;
    this.Plugin_Meta = {
      name: 'engineering',
      viewName: 'engineering plugin',
      defaultEnabled: false
    };
  };
  engineering.prototype.listen = function listen() {
    var self = this;
    self.cockpit.rov.withHistory.on('plugin.engineering.data', function (data) {
      self.cockpit.emit('plugin.engineering.data', data);
    });
  };
  window.Cockpit.plugins.push(engineering);
}(window, document, $));