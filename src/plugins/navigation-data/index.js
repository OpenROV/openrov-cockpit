(function() {
  function NavigationData(name, deps) {
    console.log('Navigation Data plugin loaded');

    var navdata = {
      roll: 0,
      pitch: 0,
      yaw: 0,
      thrust: 0,
      depth: 0,
      heading: 0
    };

    // Arduino
    deps.globalEventLoop.on( 'physicalInterface.status', function (status) {
      if ('hdgd' in status) {
        navdata.heading = status.hdgd;
      }
      if ('deep' in status) {
        navdata.depth = status.deep;
      }
      if ('pitc' in status) {
        navdata.pitch = status.pitc;
      }
      if ('roll' in status) {
        navdata.roll = status.roll;
      }
      if ('yaw' in status) {
        navdata.yaw = status.yaw;
      }
      if ('fthr' in status) {
        navdata.thrust = status.fthr;
      }
    });

    deps.cockpit.on('plugin.navigationData.zeroDepth', function () {
      deps.globalEventLoop.emit( 'physicalInterface.send', 'dzer()');
    });
    deps.cockpit.on('plugin.navigationData.calibrateCompass', function () {
      deps.globalEventLoop.emit( 'physicalInterface.send', 'ccal()');
    });

    //TODO: Add API for switching compass to GYRO only mode for relative positioning if the compass is capable.
    //This also implies the UI should be notified so that it can remove the N/S/E/W references.  Perhaps switch to
    //a -180 + 180 coordinate system?

    setInterval(function () {
      deps.cockpit.emit('plugin.navigationData.data', navdata);
    }, 100);

  }
  module.exports = function (name, deps) {
    return new NavigationData(name,deps);
  };
})();
