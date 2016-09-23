(function() 
{
    const ArduinoHelper = require('ArduinoHelper')();
    const Periodic = require( 'Periodic' );
    const Listener = require( 'Listener' );

    class CameraTilt
    {
        constructor(name, deps)
        {
            console.log('Camera tilt plugin loaded');

            this.globalBus  = deps.globalEventLoop;
            this.cockpitBus = deps.cockpit;

            this.tilt = 0;

            this.settings       = {};
            this.mcuSettings    = {};

            var self = this;
            this.SyncSettings = new Periodic( 1000, "timeout", function()
            {
                // Check latest values from MCU against plugin's desired settings
                if( self.mcuSettings.inverted === self.settings.inverted )
                {
                    // Synced, no need to continue
                    console.log( "ACK set camera tilt to: " + ( self.settings.inverted ? "true" : "false" ) );
                    self.SyncSettings.stop();
                }
                else
                {
                    // Send setting request to the MCU
                    console.log( "REQ set camera tilt to: " + ( self.settings.inverted ? "true" : "false" ) );
                    var command = 'tiltInverted(' + ( self.settings.inverted ? 1 : 0 ) + ')';
                    self.globalBus.emit( 'mcu.SendCommand', command );
                }
            });

            this.listeners = 
            {
                settings: new Listener( this.globalBus, 'settings-change.cameratilt', true, function( settings )
                {
                    // Apply settings
                    self.settings = settings.cameratilt;

                    // Enable other listeners. If they are already enabled, this will do nothing
                    self.listeners.mcuStatus.enable();
                    self.listeners.setTilt.enable();
                    self.listeners.adjustTilt.enable();

                    // Initiate a sync of the settings with the MCU
                    self.SyncSettings.start();
                }),

                mcuStatus: new Listener( this.globalBus, 'mcu.status', false, function( data )
                {
                    // Tilt Inversion
                    if( 'tiltInverted' in data )
                    {
                        self.mcuSettings.inverted = ( data.tiltInverted == 1 ? true : false );
                    }

                    // Servo position
                    if( 'servo' in data ) 
                    {
                        // Emit angle value for display purposes
                        var angle = 90 / 500 * data.servo * -1 - 90;

                        self.cockpitBus.emit( 'plugin.cameraTilt.angle', angle );
                    }
                }),

                setTilt: new Listener( this.cockpitBus, 'plugin.cameraTilt.set', false, function( percent )
                {
                    setTilt( percent );
                }),

                adjustTilt: new Listener( this.cockpitBus, 'plugin.cameraTilt.adjust', false, function( percent )
                {
                    adjustTilt( percent );
                })
            }

            function adjustTilt( percent )
            {
                setTilt( self.tilt + percent );
            }

            function setTilt( percent )
            {
                // Apply limits
                if( percent > 1.0 )
                {
                    self.tilt = 1.0;
                }
                else if( percent < -1.0 )
                {
                    self.tilt = -1.0;
                }
                else
                {
                    self.tilt = percent;
                }

                // TODO: Work actual floats onto the wire
                // Map percent to servo command
                var servoTilt = ArduinoHelper.mapA( self.tilt, -1, 1, 1000, 2000);

                // Emit command to mcu
                var command = 'tilt(' + servoTilt + ')';
                self.globalBus.emit( 'mcu.SendCommand', command );
            }
        }

        start()
        {
            this.listeners.settings.enable();
        }

        stop()
        {
            this.listeners.settings.disable();
            this.listeners.mcuStatus.disable();
            this.listeners.setTilt.disable();
            this.listeners.adjustTilt.disable();
        }

        getSettingSchema()
        {
            //from http://json-schema.org/examples.html
            return [{
                'title': 'Camera Tilt',
                'type': 'object',
                'id': 'cameratilt',
                'properties': {
                    'positiveRange': {
                        'type': 'number',
                        'default': '.7'
                    },
                    'negativeRange': {
                        'type': 'number',
                        'default': '-.7'
                    },
                    'inverted': {
                    'type': 'boolean',
                    'format': 'checkbox',
                    'default': false
                    }
                },
                'required': [
                    'positiveRange',
                    'negativeRange',
                    'inverted'
                ]
            }];
        }
    }


    module.exports = function(name, deps) 
    {
        return new CameraTilt(name, deps);
    };
}());