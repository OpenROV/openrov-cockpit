var SerialMonitor;
SerialMonitor = function SerialMonitor(name, deps) {
  if (!(this instanceof SerialMonitor))
    return new SerialMonitor(name, deps);
  console.log('This is where serail-monitor code would execute in the node process.');
  this.listen(deps);
};
SerialMonitor.prototype.listen = function listen(deps) {
  deps.globalEventLoop.on('physicalInterface.serialRecieved', function (data) {
    deps.cockpit.emit('plugin.serial-monitor.serial-received', data);
  });
  //Would prefer to put this on the global eventloop so that Hardware picks it up, but have
  //to refactor hardware to listen to the global loop first
  deps.cockpit.on('plugin.serial-monitor.start', function () {
    deps.globalEventLoop.emit('physicalInterface.startRawSerial');
  });

  deps.cockpit.on('plugin.serial-monitor.stop', function () {
    deps.globalEventLoop.emit('physicalInterface.stopRawSerial');
  });

  deps.cockpit.on('plugin.serial-monitor.serial-sent', function (data) {
    deps.rov.send(data);
  });

};
module.exports = function (name, deps) {
  return new SerialMonitor(name,deps);
};
