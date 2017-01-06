function ConnectionHealth(name, deps) {
  deps.logger.debug('This is where connection-health plugin code would execute in the node process.');
  var lastping = 0;
  this.deps = deps;
  var self = this;

  deps.cockpit.on('sys.ping', function (id) {
    self.deps.cockpit.emit('sys.pong', id);
    if (new Date().getTime() - lastping > 500) {
      self.deps.globalEventLoop.emit('mcu.SendCommand', 'ping(0)');
      lastping = new Date().getTime();
    }
  });
}
module.exports = function (name, deps) {
  return new ConnectionHealth(name, deps);
};