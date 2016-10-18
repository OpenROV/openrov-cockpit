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
        self.deps.globalEventLoop.emit('mcu.status',{cpu:v});
      });
    }, 1000); 


    var blockDeltaMS = 10; //reporting threshold in ms 
    var interval = 500;  // Check intervacl
    var simpleMovingAverage = 0;
    var smaSamples = 10.0;
    var deltaMSprior = 0;
    var intervalTimer = setInterval(function() {
        var last = process.hrtime();          // replace Date.now()        
        setImmediate(function() {
            var delta = process.hrtime(last); // seconds,nanoseconds
            var deltaMS = delta[0]*1000+delta[1]/1000000;
            var deltaNS = delta[0]*1000000000+delta[1];
            simpleMovingAverage += deltaMS/smaSamples - ((deltaMSprior)/smaSamples); 
            deltaMSprior = deltaMS;
            if (simpleMovingAverage > blockDeltaMS){
                self.deps.globalEventLoop.emit("plugin.host-diagnostics.loopDelay", simpleMovingAverage);
                self.deps.cockpit.emit("plugin.host-diagnostics.loopDelay", simpleMovingAverage);
            }
        });
    }, interval);

}
module.exports = function (name, deps) {
  return new HostDiagnostics(name, deps);
};
