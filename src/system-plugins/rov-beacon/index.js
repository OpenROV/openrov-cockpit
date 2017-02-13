'use strict';
const beaconRate = 5000;
const ignorePressureChangeThreshold = 100000;
class RovBeacon{
    constructor(name,deps){
     this.state={
         name: require('os').hostname(),
         //model:'trident',  //TODO: Add model detection
         battery:.7
     };
     this.beacon = null;
     this.bus = deps.globalEventLoop;

     this._lastIntPressureReading = {time:0,p:0,t:0};
    }

    start() {
     this.beacon = require('./beacon.js')({beaconRate});
     this.beacon.broadcast(this._genBeaconMessage.bind(this));
     this._listenForStateChanges();
    }

    stop(){
     this.beacon.stop();
     this._stopListenForStateChanges()
    }

    _genBeaconMessage(){
        this.state.exp=beaconRate*2; //Set the expeiration for this to 2X the broadcast rate.
        return this.state;
    }

    _listenForStateChanges(){
      this.bus.on('mcu.status',this._processMCUStatus.bind(this))
    }

    _stopListenForStateChanges(){
      this.bus.off('mcu.status',this._processMCUStatus.bind(this))
    }

    _computerPressureTrend(currentpressure,currenttemp){
        //TODO: Do we need to enhance for temperature compensation?
        if (this._lastIntPressureReading.p> (currentpressure+ignorePressureChangeThreshold)) {
            return this._lastIntPressureReading.p-currentpressure;
        }
        if (this._lastIntPressureReading.p< ( currentpressure-ignorePressureChangeThreshold)){
            return this._lastIntPressureReading.p-currentpressure;
        }
        return 0
    }

    _processMCUStatus(status){
        for (var data in status) {
            switch (data) {
                case 'baro_p' : 
                    //TODO: Confirm the value units of baro_p
                    //https://gitlab.com/openrov/RIOT/blob/openrov/apps/trident/CMPL3115A2.cpp#L98
                    this.state.intPressure_mb=status["baro_p"];
                    //TODO: Does this need to be smoothed over time?
                    this.state.intPressureRate=this._computerPressureTrend(this.state.intPressure_mb,status['baro_t']);
                    this._lastIntPressureReading = {time: Date.now(), p:this.state.intPressure_mb, t:status['baro_t']};
                break;
                case 'vout' :
                  this.state.battery = status['vout'];
                break;                
            }
        }
    }

}

module.exports = function (name, deps) {
  return new RovBeacon(name, deps);
};