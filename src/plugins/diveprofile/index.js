const Periodic = require( 'Periodic' );
const Listener = require( 'Listener' );

// Encoding helper functions
function encode( floatIn )
{
    return parseInt( floatIn * 1000 );
}

function decode( intIn )
{
    return ( intIn * 0.001 );
}

class DiveProfile
{
  constructor(name, deps) 
  {
    deps.logger.debug( 'DiveProfile plugin loaded' );
    var self = this;

    // Comm buses
    this.globalBus  = deps.globalEventLoop;
    this.cockpitBus = deps.cockpit;

    // Plugin settings
    this.settings = {};

    // Target settings
    this.targetWaterType  = 0;      // 0 = Fresh, 1 = Salt

    // MCU's reported settings
    this.mcuWaterType           = NaN;
    this.zeroDepthAck           = false;
    this.clearDepthOffsetAck    = false;

    // State information
    this.depth        = 0;    // meters
    this.pressure     = 0;    // kPa
    this.temperature  = 0;    // celsius
    this.waterType    = "Fresh";

    this.SyncSettings = new Periodic( 100, "timeout", function()
    {
        let synced = true;

        // Send water type until synced
        if( self.mcuWaterType !== self.targetWaterType )
        {
            synced = false;

            // Emit command to mcu
            var command = 'depth_water(' + self.targetWaterType + ')';
            self.globalBus.emit( 'mcu.SendCommand', command );
        }

        // TODO: Max Attempts
        if( synced )
        {
            // Successfully synced
            self.SyncSettings.stop();

            // Enable API
            self.listeners.zeroDepth.enable();
            self.listeners.clearDepthOffset.enable();
        }
    });

    // Periodic function that commands the MCU to zero the depth value of the depth sensor
    this.SyncZeroDepth = new Periodic( 100, "timeout", () =>
    {
        // TODO: Max Attempts
        if( self.zeroDepthAck !== true )
        {
            // Emit command to mcu
            var command = 'depth_zero()';
            self.globalBus.emit( 'mcu.SendCommand', command );
        }
        else
        {
            // Stop syncing
            self.SyncZeroDepth.stop();
        }
    });

    this.SyncClearDepthOffset = new Periodic( 100, "timeout", () =>
    {
        // TODO: Max Attempts
        if( self.clearDepthOffsetAck !== true )
        {
            // Emit command to mcu
            var command = 'depth_clroff()';
            self.globalBus.emit( 'mcu.SendCommand', command );
        }
        else
        {
            // Stop syncing
            self.SyncClearDepthOffset.stop();
        }
    });

    this.listeners = 
    {
        settings: new Listener( this.globalBus, 'settings-change.diveProfile', true, ( settings ) =>
        {
            // Apply settings
            self.settings = settings.diveProfile;

            // Set target water type
            if( self.settings.waterType == "Fresh" )
            {
              self.targetWaterType = 0;
            }
            else if( self.settings.waterType == "Salt" )
            {
              self.targetWaterType = 1;
            }

            // Enable MCU Status listener
            self.listeners.mcuStatus.enable();

            // Start syncing the current settings with the MCU
            self.SyncSettings.start();
        }),

        mcuStatus: new Listener( this.globalBus, 'mcu.status', false, ( data ) =>
        {
            // Depth
            if( 'depth_d' in data ) 
            {
                self.depth = decode( parseInt( data.depth_d ) );
                self.globalBus.emit( "plugin.diveProfile.depth", self.depth );
            }

            // Pressure
            if( 'depth_p' in data ) 
            {
                self.pressure = decode( parseInt( data.depth_p ) );
                self.globalBus.emit( "plugin.diveProfile.pressure", self.pressure );
            }

            // Temperature
            if( 'depth_t' in data ) 
            {
                self.temperature = decode( parseInt( data.depth_t ) );
                self.globalBus.emit( "plugin.diveProfile.temp", self.temperature );
            }
    
            // Water type
            if( 'depth_water' in data ) 
            {
                self.mcuWaterType = parseInt( data.depth_water );

                if( self.mcuWaterType == 0 )
                {
                    this.waterType = "Fresh";
                }
                else
                {
                    this.waterType = "Salt";
                }

                self.cockpitBus.emit( "plugin.diveProfile.waterType", self.waterType );
            }

            // Depth zero ack
            if( 'depth_zero' in data ) 
            {
                if( data.depth_zero == "ack" )
                {
                    // Done syncing
                    self.zeroDepthAck = true;
                }
            }

            // Depth offset clear ack
            if( 'depth_clroff' in data ) 
            {
                if( data.depth_clroff == "ack" )
                {
                    // Done syncing
                    self.clearDepthOffsetAck = true;
                }
            }
        }),

        zeroDepth: new Listener( this.cockpitBus, 'plugin.diveProfile.zeroDepth', false, () =>
        {
            // Zero the depth value by using the current value as the offset
            self.setZeroDepth();
        }),

        clearDepthOffset: new Listener( this.cockpitBus, 'plugin.diveProfile.clearDepthOffset', false, () =>
        {
            // Zero the depth value by using the current value as the offset
            self.clearDepthOffset();
        })
    }
  }

  setZeroDepth()
  {
    // Reset the ack and start syncing state
    this.zeroDepthAck = false;
    this.SyncZeroDepth.start();
  }

  clearDepthOffset()
  {
    // Reset the ack and start syncing state
    this.clearDepthOffsetAck = false;
    this.SyncClearDepthOffset.start();
  }

  start()
  {
    this.listeners.settings.enable();
  }

  stop()
  {
    this.listeners.settings.disable();
    this.listeners.mcuStatus.disable();
    this.listeners.zeroDepth.disable();
    this.listeners.clearDepthOffset.disable();

    this.SyncSettings.stop();
    this.SyncZeroDepth.stop();
    this.SyncClearDepthOffset.stop();
  }

  getSettingSchema()
  {
    return [{
      'title': 'Dive Profile',
      'id': 'diveProfile',
      'type': 'object',
      'properties': {
        'waterType': {
          'type': 'string',
          'enum': [
            'Fresh',
            'Salt'
          ],
          'title': 'Water Type',
          'default': 'Freshwater'
        }
      },
      'required': [
        'waterType'
      ]
    }];
  }
}

module.exports = function (name, deps) 
{
  return new DiveProfile(name, deps);
};