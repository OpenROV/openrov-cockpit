(function() 
{
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

    class Lights
    {
        constructor(name, deps)
        {
            console.log( 'Lights plugin loaded' );

            this.globalBus  = deps.globalEventLoop;
            this.cockpitBus = deps.cockpit;

            this.targetPower          = 0;
            this.targetPower_enc      = 0;
            this.mcuTargetPower_enc   = 0;

            var self = this;

            this.SyncTargetPower = new Periodic( 33, "timeout", function()
            {
                var synced = true;

                // Send target power to MCU until it responds with affirmation
                if( self.mcuTargetPower_enc !== self.targetPower_enc )
                {
                    synced = false;

                    // Encode floating point to integer representation
                    var command = 'lights_tpow(' + self.targetPower_enc + ')';

                    console.log("LIGHT COMMAND:"+ 'lights_tpow(' + self.targetPower_enc + ')' );

                    // Emit command to mcu
                    self.globalBus.emit( 'mcu.SendCommand', command );
                }

                if( synced )
                {
                    // No need to continue
                    self.SyncTargetPower.stop();
                }
            });

            this.listeners = 
            {
                settings: new Listener( this.globalBus, 'settings-change.lights', true, function( settings )
                {
                    // Apply settings
                    self.settings = settings.lights;
                    
                    // Emit settings update to cockpit
                    self.cockpitBus.emit( 'plugin.lights.settingsChange', self.settings );

                    // Enable MCU Status listener
                    self.listeners.mcuStatus.enable();

                    // Enable API
                    self.listeners.setTargetPower.enable();
                }),

                mcuStatus: new Listener( this.globalBus, 'mcu.status', false, function( data )
                {
                    // Current light power
                    if( 'lights_pow' in data ) 
                    {
                        // Convert from integer to float
                        var power = decode( parseInt( data.lights_pow ) );

                        // Emit on cockpit bus for UI purposes
                        self.cockpitBus.emit( 'plugin.lights.currentPower', power );
                    }

                    // Target light power
                    if( 'lights_tpow' in data ) 
                    {
                        // Save encoded version for sync validation purposes
                        self.mcuTargetPower_enc = parseInt( data.lights_tpow );

                        // Convert from integer to float
                        var power = decode( self.mcuTargetPower_enc );

                        // Emit the real target power on the cockpit bus for UI purposes
                        self.cockpitBus.emit( 'plugin.lights.targetPower', power );
                    }
                }),

                setTargetPower: new Listener( this.cockpitBus, 'plugin.lights.setTargetPower', false, function( powerIn )
                {
                    // Set new target Power
                    self.setTargetPower( powerIn );
                })
            }
        }

        setTargetPower( powerIn )
        {
            var self = this;

            // Validate input
            if( isNaN( powerIn ) )
            {
              // Ignore
              return;
            }

            // Apply limits
            if( powerIn > 1.0 )
            {
                self.targetPower = 1.0;
            }
            else if( powerIn < 0 )
            {
                self.targetPower = 0;
            }
            else
            {
                self.targetPower = powerIn;
            }

            self.targetPower_enc = encode( self.targetPower );

            // Start targetPower sync, if not already running
            self.SyncTargetPower.start();
        }
        
        start()
        {
          this.listeners.settings.enable();
        }

        stop()
        {
          this.listeners.settings.disable();
          this.listeners.mcuStatus.disable();
          this.listeners.setTargetPower.disable();
        }

        getSettingSchema()
        {
            //from http://json-schema.org/examples.html
            return [{
                'title': 'Lights',
                'type': 'object',
                'managedBy': '_hidden',                
                'id': 'lights',
                'properties': {},
                'required': []
            }];
        }
    }

    module.exports = function(name, deps) 
    {
        return new Lights(name, deps);
    };
}());