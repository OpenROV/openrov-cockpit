(function () {
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

    // Encoding helper functions
    function encode( floatIn )
    {
        return parseInt( floatIn * 1000 );
    }

    function decode( intIn )
    {
        return ( intIn * 0.001 );
    }
      
    // Arduino
    deps.globalEventLoop.on('mcu.status', function (status)
    {
      if ('depth_d' in status) {
        navdata.depth = decode( status.depth_d );
      }
      if ('imu_p' in status) {
        navdata.pitch = decode( status.imu_p );
      }
      if ('imu_r' in status) {
        navdata.roll = decode( status.imu_r );
      }
      if ('imu_y' in status) {
        navdata.yaw = decode( status.imu_y );
        navdata.heading = decode( status.imu_y );
      }
      if ('fthr' in status) {
        navdata.thrust = status.fthr;
      }
    });

    deps.cockpit.on('plugin.navigationData.zeroDepth', function () {
      deps.globalEventLoop.emit('mcu.SendCommand', 'dzer()');
    });

    deps.cockpit.on('plugin.navigationData.calibrateCompass', function () {
      deps.globalEventLoop.emit('mcu.SendCommand', 'ccal()');
    });

    //TODO: Add API for switching compass to GYRO only mode for relative positioning if the compass is capable.
    //This also implies the UI should be notified so that it can remove the N/S/E/W references.  Perhaps switch to
    //a -180 + 180 coordinate system?
    setInterval(function () {
      deps.cockpit.emit('plugin.navigationData.data', navdata);
    }, 100);
  }
  module.exports = function (name, deps) {
    return new NavigationData(name, deps);
  };
}());