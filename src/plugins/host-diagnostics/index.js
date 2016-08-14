  var os = require('os-utils');

function HostDiagnostics(name, deps) {
  console.log('This is where HostDiagnostics plugin code would execute in the node process.');
    var self = this;
    this.deps = deps;
    this.currCpuUsage=0;
    setInterval(function () {
      os.cpuUsage(function (v) {
        self.currCpuUsage = v;
        //TODO: Refactor mcu.status to be a global telemetry message so that we can
        //aggegate telemetry form any source in to a single message stream.
        self.deps.globalEventLoopww.emit('mcu.status',{cpu:v});
      });
    }, 1000); 
}
module.exports = function (name, deps) {
  return new HostDiagnostics(name, deps);
};