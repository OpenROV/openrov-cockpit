function thrusters2x1(name, deps) {
  console.log('The motor_diags plugin.');

  deps.rov.on('status', function (status) {
    if ('mtrmod' in status) {
    }
  });

  deps.cockpit.on('callibrate_escs', function () {
    deps.rov.send('mcal()');
    console.log('mcal() sent');
  });

  deps.cockpit.on('plugin.thrusters2x1.motorTest', function(positions){
     deps.rov.sendMotorTest(positions.port, positions.starboard, positions.vertical);
  });

}
module.exports = thrusters2x1;
