(function (window) {
  'use strict';
  var ConnectionHealth;
  ConnectionHealth = function ConnectionHealth(cockpit) {
    console.log('Loading ConnectionHealth plugin in the browser.');
    // Instance variables
    this.cockpit = cockpit;
    this.beagletoBrowserMeter = null;
    this.pingtime = 0;
    this.pingCache = [0,0,0,0,0];
    this.pingAvg = 0;
  };
//plugin.connection-health.connect-state
  ConnectionHealth.prototype.listen = function listen() {
    var self = this;
    //This is now also used for the deadman switch.
    this.pinger = setInterval(function () {
      var _starttime = performance.now();
      self.cockpit.emit('ping',_starttime);
      self.cockpit.rov.emit('ping', _starttime);
    }, 1000);

    this.cockpit.rov.on('pong', function (id) {
      var t = performance.now();
      var tprime = id;
      self.cockpit.emit('pong',id);
      self.pingtime = t-tprime;
      self.pingCache.push(self.pingtime);
      self.pingAvg =
        self.pingCache.reduce(function(total,number){
            return total+number;
          },0);
      self.cockpit.emit('plugin.connection-health.ping-latency',self.pingtime);
    //  console.log("ping:" +self.pingtime);
    });
  };
  window.Cockpit.plugins.push(ConnectionHealth);
}(window));
