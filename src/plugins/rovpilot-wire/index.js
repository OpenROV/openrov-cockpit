(function() {
  var DISABLED = 'DISABLED';

  var ROVPilotWire = function ROVPilotWire(deps) {
    console.log('The rovpilot plugin.');
    var self = this;
    self.SAMPLE_PERIOD = 1000 / deps.config.sample_freq;

    self.rov = deps.rov;

    deps.cockpit.on('plugin.rovpilot.headingHold.toggle', function () {
      deps.rov.send('holdHeading_toggle()');
    });

    deps.cockpit.on('plugin.rovpilot.headingHold.set', function (value) {
      deps.rov.send('holdHeading_toggle('+ value +')');
    });

    deps.cockpit.on('plugin.rovpilot.depthHold.toggle', function () {
      deps.rov.send('holdDepth_toggle()');
    });

    deps.cockpit.on('plugin.rovpilot.depthHold.set', function (value) {
      deps.rov.send('holdDepth_toggle('+ value +')');
    });

    // Arduino
    deps.rov.on('status', function (status) {
      var enabled;
      if ('targetDepth' in status) {
        enabled = status.targetDepth != DISABLED;
        deps.cockpit.emit('plugin.rovpilot.depthHold.' + (enabled ? 'enabled' : 'disabled'));
        if (enabled) {
           deps.cockpit.emit('plugin.rovpilot.depthHold.target', Number(status.targetDepth)/100);
       }
      }
      if ('targetHeading' in status) {
        enabled = status.targetHeading != DISABLED;
        deps.cockpit.emit('plugin.rovpilot.headingHold.' + (enabled ? 'enabled' : 'disabled'));
        if (enabled) {
          deps.cockpit.emit('plugin.rovpilot.headingHold.target', status.targetHeading);
        }
      }
    });

    return this;
  };

  module.exports = function (name, deps) {
    return new ROVPilotWire(deps);
  };

})();
