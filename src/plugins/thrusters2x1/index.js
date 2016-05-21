function thrusters2x1(name, deps) {
  console.log('The motor_diags plugin.');

  //instance variables
  this.cockpit = deps.cockpit;
  this.global = deps.globalEventLoop;
  this.deps = deps;


}

thrusters2x1.prototype.start = function start(){
  var self=this;

  self.global.withHistory.on('settings-change.thrusters2x1',function(data){
    var settings = data.thrusters2x1;
    var port = settings.port['forward-modifier'];
    var vertical = settings.vertical['forward-modifier'];
    var starbord = settings.starboard['forward-modifier'];
    var nport = settings.port['reverse-modifier'];
    var nvertical = settings.vertical['reverse-modifier'];
    var nstarbord =settings.starboard['reverse-modifier'];
    if (settings.port.reversed) {
      port = port * -1;
      nport = nport * -1;
    }
    if (settings.vertical.reversed) {
      vertical = vertical * -1;
      nvertical = nvertical * -1;
    }
    if (settings.starboard.reversed) {
      starbord = starbord * -1;
      nstarbord = nstarbord * -1;
    }
    
    //todo: Move to motor-diag plugin
    //API to Arduino to pass a percent in 2 decimal accuracy requires multipling by 100 before sending.
    command = 'mtrmod1(' + port * 100 + ',' + vertical * 100 + ',' + starbord * 100 + ')';
    self.deps.globalEventLoop.emit( 'physicalInterface.send', command );
    
    command = 'mtrmod2(' + nport * 100 + ',' + nvertical * 100 + ',' + nstarbord * 100 + ')';
    self.deps.globalEventLoop.emit( 'physicalInterface.send', command );

  })

  self.deps.globalEventLoop.on('physicalInterface.status', function (status) 
  {
    if ('mtrmod' in status) 
    {
    }
  });

  self.cockpit.on('callibrate_escs', function () {
    self.deps.globalEventLoop.emit( 'physicalInterface.send', 'mcal()');
    console.log('mcal() sent');
  });

  self.cockpit.on('plugin.thrusters2x1.motorTest', function(positions)
  {
     self.deps.globalEventLoop.emit( 'physicalInterface.sendMotorTest', positions.port, positions.starboard, positions.vertical);
  });
}

thrusters2x1.prototype.getSettingSchema = function getSettingSchema(){
  return [
    {
        "title": "Thruster Settings",
        "id" : "thrusters2x1",
        "type": "object",
        "properties": {
            "motor-response-delay-ms": {
                "type": "number",
                "title": "Motor response delay (ms)",
                "minimum": 0,
                "maximum": 100,
                "default": 0
            },
            "port": {
              "title:": "Port Motor",
              "type": "object",
              "properties": {
                "reversed" : {"type":"boolean", "format": "checkbox","default":false},
                "forward-modifier" : {"type":"number","default": 1},
                "reverse-modifier" : {"type":"number","default": 2}
              }
            },
            "vertical": {
              "title:": "Port Motor",
              "type": "object",
              "properties": {
                "reversed" : {"type":"boolean", "format": "checkbox","default":false},
                "forward-modifier" : {"type":"number","default": 1},
                "reverse-modifier" : {"type":"number","default": 2}
              }
            },
            "starboard": {
              "title:": "Port Motor",
              "type": "object",
              "properties": {
                "reversed" : {"type":"boolean", "format": "checkbox","default":false},
                "forward-modifier" : {"type":"number","default": 1},
                "reverse-modifier" : {"type":"number","default": 2}
              }
            }
        }
    }
  ]
}

//Expose either a function or object for require
module.exports = function(name,deps){
  return new thrusters2x1(name,deps);
}
