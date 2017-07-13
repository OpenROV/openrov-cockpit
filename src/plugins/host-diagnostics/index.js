const os = require('os-utils');

/*   private shared variables for smoothing state information   */
var blockDeltaMS = 10; //reporting threshold in ms 
var interval = 500;  // Check intervacl
var simpleMovingAverage = 0;
var smaSamples = 10.0;
var deltaMSprior = 0;

var baroReadings = [];

class HostDiagnostics{
  constructor(name, deps){
    deps.logger.debug('This is where HostDiagnostics plugin code would execute in the node process.');

    this.deps = deps;
    this.bus = deps.globalEventLoop;
    this.currCpuUsage=0;
    this._handleBaro = this._handleBaro.bind(this);
    this._emitPressureTestData = this._emitPressureTestData.bind(this);
    this._emitHostDiagnostics = this._emitHostDiagnostics.bind(this);
    this._emitHostDiagnosticsLoopDelay = this._emitHostDiagnosticsLoopDelay.bind(this);

  }

  _emitHostDiagnostics(){
      os.cpuUsage((v) => {
        this.currCpuUsage = v;
        //TODO: Refactor mcu.status to be a global telemetry message so that we can
        //aggegate telemetry form any source in to a single message stream.
        this.deps.globalEventLoop.emit('mcu.status',{cpu:v});
      });    
  }

  _emitHostDiagnosticsLoopDelay(){
      var last = process.hrtime();          // replace Date.now()        
      setImmediate(() => {
          var delta = process.hrtime(last); // seconds,nanoseconds
          var deltaMS = delta[0]*1000+delta[1]/1000000;
          var deltaNS = delta[0]*1000000000+delta[1];
          simpleMovingAverage += deltaMS/smaSamples - ((deltaMSprior)/smaSamples); 
          deltaMSprior = deltaMS;
          if (simpleMovingAverage > blockDeltaMS){
              this.deps.globalEventLoop.emit("plugin.host-diagnostics.loopDelay", simpleMovingAverage);
              this.deps.cockpit.emit("plugin.host-diagnostics.loopDelay", simpleMovingAverage);
          }
      });
  }

  _calculateRateOfPressureChange(){
    if (baroReadings.length < 2){
      return {};
    }
    var oneMinuteAgo = Date.now() - (60*1000);
    var tenMinutesAgo = Date.now() - (10*60*1000);
    var twentyMinutesAgo = Date.now() - (20*60*1000);
    var i = baroReadings.length-1;
    var sample = baroReadings[i];
    var fromBaro = 0;
    var result = {};
    while((sample.timestamp>oneMinuteAgo) && (i>0)){
      i--;
      fromBaro = sample;
      sample = baroReadings[i];
    }
    result.rate_1_minute = (baroReadings[baroReadings.length-1].baro_p - fromBaro.baro_p);
    while((sample.timestamp>tenMinutesAgo) && (i>0)){
      i--;
      fromBaro = sample;
      sample = baroReadings[i];
    }
    result.rate_10_minute = (baroReadings[baroReadings.length-1].baro_p - fromBaro.baro_p);
    while((sample.timestamp>twentyMinutesAgo) && (i>0)){
      i--;
      fromBaro = sample;
      sample = baroReadings[i];
    }
    result.rate_20_minute = (baroReadings[baroReadings.length-1].baro_p - fromBaro.baro_p);    
    //returnig the barometer change in the last minute
    return  result;
  }

  getPressureTestState(){
      if (baroReadings.length==0){
        return {error:"No barometer data found."};
      }
      var status = this._calculateRateOfPressureChange();
      
      status.current_pressure= baroReadings[baroReadings.length-1];
      status.available_sample_duration = status.current_pressure.timestamp - baroReadings[0].timestamp;
      return status;
  }

  _registerRestAPIListeners(express){
    express.get('/pressure_test', (req, res)=> {

      res.json(this.getPressureTestState());
    });    

    express.post('/blink', (req, res)=> {
      this.bus.emit('mcu.SendCommand', "wake()");
      res.json("OK");
    });        
  }

  _handleBaro(status){
      for (var data in status) {
          switch (data) {
              case 'baro_p' : 
                  baroReadings.push({
                    timestamp: Date.now(),
                    baro_p: status["baro_p"],
                    baro_t: status['baro_t']
                  })
                  while (baroReadings.length > 5000){
                    baroReadings.shift();
                  }
              break;             
          }
      }
  }

  _emitPressureTestData(){
    if (baroReadings.length>0){
      this.bus.emit('plugin.host-diagnostics.pressure-test-state',this.getPressureTestState());
    }
  }

  runPressureTest(){
    this.bus.on('mcu.status',this._handleBaro);
    this.emitPressureTestDataInterval = setInterval(this._emitPressureTestData,1000);
  }

  start(){
     this.emitHostInfoInterval = setInterval(this._emitHostDiagnostics,1000);
     this.emitHostLoopDelayInterval = setInterval(this._emitHostDiagnosticsLoopDelay,interval);
     this._registerRestAPIListeners(this.deps.app);
     this.runPressureTest();
  }

  stop(){
    if (this.emitHostInfoInterval){
      clearInterval(this.emitHostInfoInterval);
      this.emitHostInfoInterval = null;
    }
    if (this._emitHostDiagnosticsLoopDelay){
      clearInterval(this._emitHostDiagnosticsLoopDelay);
      this._emitHostDiagnosticsLoopDelay = null;
    }    
  }
}

module.exports = function (name, deps) {
  return new HostDiagnostics(name, deps);
};
