(function () {
  var sharedFunctions = require('./public/js/telemetryToSystemPower.js');
  var PREFERENCES_NS = 'plugins';
  var SystemEnvionment = function SystemEnvironment(name, deps) {
    console.log('Controllerboard2x:SystemEnvironment plugin loaded');
    deps.globalEventLoop.on('mcu.status', function (data) {
    });
  };
  var SystemPower = function SystemPower(name, deps) {
    console.log('Controllerboard2x:SystemPower plugin loaded');
    this.config = deps.config;
    this.cockpit = deps.cockpit;
    var self = this;
    deps.globalEventLoop.on('mcu.status', function (data) {
      var mappedPowerObject = sharedFunctions.telemetryToSystemPower(data);
    });
    deps.cockpit.on('plugin.systemPower.powerESCs', function (enable) {
      if (enable){
        deps.globalEventLoop.emit('mcu.SendCommand', 'escp(1)');
      } else {
        deps.globalEventLoop.emit('mcu.SendCommand', 'escp(0)');      
      }
    });

  };
  SystemPower.prototype.getSettingSchema = function getSettingSchema() {
    //Technically the json-editor supports "watch" that can be used
    //to dynamically add items from an array as an ENUM to a select
    //in the same document.  Have an issue filed as I cannot get it
    //to work.  WORKAROUND: Manually parse the config for the Battery
    //types and inject them in to the schema.  TODO: signal an update
    //to the schema that is caches in several spots when a Battery
    //is changed.
    BatteryOptions = [
      'TrustFire',
      'LiFePO4'
    ];
    var b = this.config.preferences.get(PREFERENCES_NS);
    if ('batteryDefintions' in b) {
      b.batteryDefintions.batteries.forEach(function (bat) {
        BatteryOptions.push(bat.name);
      });
    }
    return [{
        'id': 'batteryDefintions',
        'title': 'Battery Formulas',
        'category' : 'hardware',        
        'type': 'object',
        'properties': {
          'batteries': {
            'id': 'batteries',
            'type': 'array',
            'items': {
              'id': '0',
              'type': 'object',
              'properties': {
                'name': {
                  'id': 'name',
                  'type': 'string'
                },
                'minVoltage': {
                  'id': 'minVoltage',
                  'type': 'integer'
                },
                'maxVoltage': {
                  'id': 'maxVoltage',
                  'type': 'integer'
                }
              },
              'required': [
                'name',
                'minVoltage',
                'maxVoltage'
              ]
            },
            'required': ['0'],
            'default': [
              {
                'name': 'TrustFire',
                'minVoltage': 8,
                'maxVoltage': 13
              },
              {
                'name': 'LiFePO4',
                'minVoltage': 7,
                'maxVoltage': 10
              },
              {
                'name': 'NMC',
                'minVoltage': 7,
                'maxVoltage': 10.8
              }
            ]
          },
          'selectedBattery': {
            'id': 'selectedBattery',
            'type': 'string',
            'enum': BatteryOptions,
            'default': 'LiFePO4'
          }
        },
        'required': [
          'batteries',
          'selectedBattery'
        ]
      }];
  };
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
  var Controllerboard2x = function Controllerboard2x(name, deps) {
    console.log('Controllerboard2x plugin loaded');
    deps.globalEventLoop.on('mcu.status', function (data) {
    });
  };
  Controllerboard2x.prototype.getSettingSchema = function getSettingSchema() {
    var item = this.systempower.getSettingSchema();
    return item;
  };
  module.exports = function (name, deps)
   {
    if( process.env.PRODUCTID == "trident" )
    {
        console.log( "Not supported on trident" );
        return {};
    }

    var result = new Controllerboard2x(name, deps);
    result.systempower = new SystemPower(name, deps);
    result.systemenvionment = new SystemEnvionment(name, deps);
    return result;
  };
}());