var sharedFunctions = require('./public/js/telemetryToSystemPower.js');
var PREFERENCES_NS = 'plugins';

class SystemEnvironment
{
    constructor(name, deps)
    {
      console.log('Controllerboard2x:SystemEnvironment plugin loaded');
    }
}

class SystemPower
{
    constructor(name, deps)
    {
      console.log('Controllerboard2x:SystemPower plugin loaded');

      this.config   = deps.config;
      this.cockpit  = deps.cockpit;
      var self      = this;

      deps.cockpit.on('plugin.systemPower.powerESCs', function (enable)
      {
        if (enable)
        {
          deps.globalEventLoop.emit('mcu.SendCommand', 'escp(1)');
        } 
        else 
        {
          deps.globalEventLoop.emit('mcu.SendCommand', 'escp(0)');      
        }
      });
    }

    getSettingSchema()
    {
      // TODO:
      // If settings already exist, new defaults aren't available. 
      // Do we have an idiomatic way for upgrading old settings so that
      // renamed properties/values and new ones replace them?

      var b = this.config.preferences.get(PREFERENCES_NS);

      return [{
        id:       'batteryDefinitions',
        title:    'Battery Formulas',
        category: 'power',        
        type:     'object',

        properties: 
        {
          batteries: 
          {
            title:          "Batteries",
            type:           "array",
            minItems:       1,
            uniqueItems:    true,
            propertyOrder:  1,

            items: 
            {
              type:           "object",
              headerTemplate: "{{self.name}}",
              properties: 
              {
                name:         { type: 'string', default: "New Battery" },
                minVoltage:   { type: 'number', default: 8 },
                maxVoltage:   { type: 'number', default: 12.6 }
              },
              required: 
              [
                'name',
                'minVoltage',
                'maxVoltage'
              ]
            },
            default: 
            [
              {
                name:       'TrustFire',
                minVoltage: 8,
                maxVoltage: 13
              },
              {
                name:       'LiFePO4 (OpenROV White)',
                minVoltage: 7,
                maxVoltage: 10
              },
              {
                name:       'High-Capacity NMC (OpenROV Blue)',
                minVoltage: 8,
                maxVoltage: 12.6
              }
            ]
          },
          selectedBattery: 
          {
            title:      "Selected Battery",
            type:       'string',
            propertyOrder: 0,

            enumSource: "possible_batteries",
            enumValue: "{{item.name}}",
            watch: 
            {
              "possible_batteries": "root.batteryDefinitions.batteries"
            },

            default:    "LiFePO4 (OpenROV White)"
          }
        },
        
        required: 
        [
          'batteries',
          'selectedBattery'
        ]
      }];
    }
};

// Controller Board 2X Plugin
class Controllerboard2x
{
    constructor(name, deps)
    {
      console.log('Controllerboard2x plugin loaded');

      this.systempower        = new SystemPower(name, deps);
      this.systemenvironment  = new SystemEnvironment(name, deps);
    }

    getSettingSchema() 
    {
      var item = this.systempower.getSettingSchema();
      return item;
    }
}

module.exports = function (name, deps)
{
  if( process.env.PRODUCTID == "trident" )
  {
      console.log( "Not supported on trident" );
      return {};
  }

  return new Controllerboard2x(name, deps);
};