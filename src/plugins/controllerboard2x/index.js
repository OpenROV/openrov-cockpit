(function() {
  var PREFERENCES_NS="plugins"
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

    this.config = deps.config;

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

  SystemPower.prototype.getSettingSchema = function getSettingSchema(){

    //Technically the json-editor supports "watch" that can be used
    //to dynamically add items from an array as an ENUM to a select
    //in the same document.  Have an issue filed as I cannot get it
    //to work.  WORKAROUND: Manually parse the config for the Battery
    //types and inject them in to the schema.  TODO: signal an update
    //to the schema that is caches in several spots when a Battery
    //is changed.
    BatteryOptions = [];
    var b = this.config.preferences.get(PREFERENCES_NS);
    b.batteryDefintions.batteries.forEach(function(bat){
      BatteryOptions.push(bat.name);
    });

    return      [{
      "id": "batteryDefintions",
      "type": "object",
      "properties": {
        "batteries": {
          "id": "batteries",
          "type": "array",
          "items": {
            "id": "0",
            "type": "object",
            "properties": {
              "name": {
                "id": "name",
                "type": "string"
              },
              "minVoltage": {
                "id": "minVoltage",
                "type": "integer"
              },
              "maxVoltage": {
                "id": "maxVoltage",
                "type": "integer"
              }
            },
            "required": [
              "name",
              "minVoltage",
              "maxVoltage"
            ]
          },
          "required": [
            "0"
          ]
        },
        "selectedBattery" : {
          "id" : "selectedBattery",
          "type" : "string",
          "enum" : BatteryOptions
        }
      },
      "required": [
        "batteries",
        "selectedBattery"
      ]

    }];

  }
/*
,
"selectedBattery" : {
  "id" : "selectedBattery",
  "type" : "string",
  "watch" : {
    "batteryEnum" : "batteries"
  },
  "enumSource" : [{
    "source" : "batteryEnum",
    "value" : "{{item.name}}"
  }]
}
*/


  var Controllerboard2x=function Controllerboard2x(name, deps) {
    console.log('Controllerboard2x plugin loaded');

    deps.rov.on('status', function(data) {
      //time, cpu

    });

  }

  Controllerboard2x.prototype.getSettingSchema = function getSettingSchema(){
    var item= this.systempower.getSettingSchema();
    return item;
  }

  module.exports = function (name, deps) {
    var result = new Controllerboard2x(name,deps);
    result.systempower = new SystemPower(name,deps);
    result.systemenvionment = new SystemEnvionment(name,deps);
    return result;
  };

})();
