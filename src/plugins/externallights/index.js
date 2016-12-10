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

    class ExternalLights
    {
        constructor(name, deps)
        {
            console.log( 'ExternalLights plugin loaded' );

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
                    var command = 'elights_tpow(' + self.targetPower_enc + ')';

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
                settings: new Listener( this.globalBus, 'settings-change.external-lights', true, function( settings )
                {
                    // Apply settings
                    self.settings = settings.lights;
                    
                    // Emit settings update to cockpit
                    self.cockpitBus.emit( 'plugin.externalLights.settingsChange', self.settings );

                    // Enable MCU Status listener
                    self.listeners.mcuStatus.enable();

                    // Enable API
                    self.listeners.setTargetPower.enable();
                }),

                mcuStatus: new Listener( this.globalBus, 'mcu.status', false, function( data )
                {
                    // Current light power
                    if( 'elights_pow' in data ) 
                    {
                        // Convert from integer to float
                        var power = decode( parseInt( data.elights_pow ) );

                        // Emit on cockpit bus for UI purposes
                        self.cockpitBus.emit( 'plugin.externalLights.currentPower', power );
                    }

                    // Target light power
                    if( 'elights_tpow' in data ) 
                    {
                        // Save encoded version for sync validation purposes
                        self.mcuTargetPower_enc = parseInt( data.elights_tpow );

                        // Convert from integer to float
                        var power = decode( self.mcuTargetPower_enc );

                        // Emit the real target power on the cockpit bus for UI purposes
                        self.cockpitBus.emit( 'plugin.externalLights.targetPower', power );
                    }
                }),

                setTargetPower: new Listener( this.cockpitBus, 'plugin.externalLights.setTargetPower', false, function( powerIn )
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
                'title': 'External Lights',
                'type': 'object',
                'id': 'external-lights',
                'managedBy': '_hidden',
                'properties': {},
                'required': []
            }];
        }
    }

    module.exports = function(name, deps) 
    {
        if( process.env.PRODUCTID == "trident" )
        {
            console.log( "Not supported on trident" );
            return {};
        }

        return new ExternalLights(name, deps);
    };
}());