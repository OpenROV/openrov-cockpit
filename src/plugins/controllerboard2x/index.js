(function() {

  var SystemEnvionment = function SystemEnvironment(name, deps) {
    console.log('Controllerboard2x:SystemEnvironment plugin loaded');

    deps.rov.on('status', function(data) {
      //Humidity Sensor
      //Temperature
      //cpu
      //time
    });

  };

  var SystemPower = function SystemPower(name,deps){
    console.log('Controllerboard2x:SystemPower plugin loaded');

    deps.rov.on('status', function(data) {
//      if ('')
    });

    deps.cockpit.on('plugin.systemPower.powerOnESCs', function () {
      self.rov.send('escp(1)');

      deps.cockpit.emit('plugin.rovpilot.esc.enabled'); // should be handled through status
    });

    deps.cockpit.on('plugin.systemPower.powerOffESCs', function () {
      self.rov.send('escp(0)');

      deps.cockpit.emit('plugin.rovpilot.esc.disabled'); // should be handled through status
    });


  };



  function Controllerboard2x(name, deps) {
    console.log('Controllerboard2x plugin loaded');

    deps.rov.on('status', function(data) {
      //time, cpu

    });

  }
  module.exports = Controllerboard2x;
})();
