function readyAyeReady(name, deps) {
  var done = false;
  var lastLightCmd = '';
  this.deps = deps;
  var self = this;
  //rovsys comes up when arduino starts
  deps.globalEventLoop.on('mcu.rovsys', function (s) {
    if (!done) {
      console.log('The ROV is ready!.');
      setLight('12.5');
      deps.globalEventLoop.emit('plugin.systemPower.powerOffESCs');
      setTimeout(function () {
        self.deps.globalEventLoop.emit('plugin.systemPower.powerOnESCs');
      }, 10);
      done = true;
    }
  });
  // send the light command initially and then cylcle through the lights
  var setLight = function (light) {
    var cmd = 'ligt(' + light + ')';
    deps.globalEventLoop.emit('mcu.SendCommand', cmd);
    var chk = setInterval(function () {
        if (lastLightCmd != cmd) {
          deps.globalEventLoop.emit('mcu.SendCommand', cmd);
        } else {
          clearInterval(chk);
          //TODO: Add motor chirp by cycling ESCs
          setTimeout(function () {
            deps.globalEventLoop.emit('mcu.SendCommand', 'ligt(24.5)');
          }, 500);
          setTimeout(function () {
            deps.globalEventLoop.emit('mcu.SendCommand', 'ligt(40.5)');
          }, 1000);
          setTimeout(function () {
            deps.globalEventLoop.emit('mcu.SendCommand', 'ligt(24.5)');
          }, 1500);
          setTimeout(function () {
            deps.globalEventLoop.emit('mcu.SendCommand', 'ligt(12.5)');
          }, 2000);
          setTimeout(function () {
            deps.globalEventLoop.emit('mcu.SendCommand', 'ligt(0)');
          }, 2500);
          setTimeout(function () {
            deps.globalEventLoop.emit('mcu.SendCommand', 'ligt(50)');
          }, 3500);
          setTimeout(function () {
            deps.globalEventLoop.emit('mcu.SendCommand', 'ligt(0)');
          }, 4000);
          setTimeout(function () {
            deps.globalEventLoop.emit('mcu.SendCommand', 'ligt(50)');
          }, 4500);
          setTimeout(function () {
            deps.globalEventLoop.emit('mcu.SendCommand', 'ligt(0)');
          }, 5000);
        }
      }, 400);
  };
  deps.globalEventLoop.on('mcu.command', function (command) {
    lastLightCmd = command;
  });
}
module.exports = function (name, deps) {
  return new readyAyeReady(name, deps);
};