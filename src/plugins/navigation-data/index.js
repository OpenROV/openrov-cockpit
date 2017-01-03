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
    this.state = {imuMode: 'gyro'}
    var self=this;

    // Encoding helper functions
    function encode( floatIn )
    {
        return parseInt( floatIn * 1000 );
    }

    function decode( intIn )
    {
        return ( intIn * 0.001 );
    }
      
    // IMU state provided by IMU plugin
    deps.globalEventLoop.on('plugin.imu.roll', function (value)
    {
      navdata.roll = value;
    });

    deps.globalEventLoop.on('plugin.imu.pitch', function (value)
    {
      navdata.pitch = value;
    });

    deps.globalEventLoop.on('plugin.imu.yaw', function (value)
    {
      navdata.yaw     = value;
      navdata.heading = value;
    });

    deps.globalEventLoop.on('mcu.status', function (status)
    {
      // TODO: Move to depth plugin
      if ('depth_d' in status) 
      {
        navdata.depth = decode( status.depth_d );
      }

      // TODO: Move to IMU plugin
      if ('imu_mode' in status) 
      {
        self.state.imuMode = status.imu_mode==0?'gyro':'compass';
        deps.cockpit.emit('plugin.navigationData.state', self.state);                
      }

      if ('fthr' in status) 
      {
        navdata.thrust = status.fthr;
      }
    });

    // TODO: Move to IMU plugin
    deps.cockpit.on('plugin.navigationData.setState', function (state) 
    {
      if (state.imuMode)
      {
        var mode = 0; //gyro
        if (state.imuMode=="compass")
        {
          mode = 1
        }
        deps.globalEventLoop.emit('mcu.SendCommand', `imu_mode(${mode})`);
      }
    });

    // Emit navdata at 10Hz rate
    setInterval(function () 
    {
      deps.cockpit.emit('plugin.navigationData.data', navdata);
    }, 100);
  }
  
  module.exports = function (name, deps) {
    return new NavigationData(name, deps);
  };
}());