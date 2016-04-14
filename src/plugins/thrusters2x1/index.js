function thrusters2x1(name, deps) {
  console.log('The motor_diags plugin.');

  //instance variables
  this.rov = deps.rov;
  this.cockpit = deps.cockpit;


}

thrusters2x1.prototype.start = function start(){
  var self=this;

  self.rov.on('status', function (status) {
    if ('mtrmod' in status) {
    }
  });

  self.cockpit.on('callibrate_escs', function () {
    deps.rov.send('mcal()');
    console.log('mcal() sent');
  });

  self.cockpit.on('plugin.thrusters2x1.motorTest', function(positions){
     deps.rov.sendMotorTest(positions.port, positions.starboard, positions.vertical);
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
                "reversed" : {"type": "boolean", "format": "checkbox"},
                "forward-modifier" : {"type":"number","default": 1},
                "reverse-modifier" : {"type":"number","default": 2}
              }
            },
            "vertical": {
              "title:": "Port Motor",
              "type": "object",
              "properties": {
                "reversed" : {"type": "boolean", "format": "checkbox"},
                "forward-modifier" : {"type":"number","default": 1},
                "reverse-modifier" : {"type":"number","default": 2}
              }
            },
            "starboard": {
              "title:": "Port Motor",
              "type": "object",
              "properties": {
                "reversed" : {"type": "boolean", "format": "checkbox"},
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
