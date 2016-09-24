(function() 
{
    const ArduinoHelper = require('ArduinoHelper')();
    const Periodic = require( 'Periodic' );
    const Listener = require( 'Listener' );

    const kZeroPosMicrosecs = 1487.0;
    const kMicrosecPerDegree = 9.523809;
    const kDegPerMicrosec = ( 1 / kMicrosecPerDegree );

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
                    self.SyncSettings.stop();
                }
                else
                {
                    // Send setting request to the MCU
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
                    self.listeners.setPosition.enable();
                    self.listeners.modifyPosition.enable();
                    self.listeners.stepPositive.enable();
                    self.listeners.stepNegative.enable();

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
                        // TODO: Listen for actual angle
                        // Emit angle value for display purposes
                        var angle = ( data.servo - kZeroPosMicrosecs ) * kDegPerMicrosec;

                        self.cockpitBus.emit( 'plugin.cameraTilt.angle', angle );
                    }
                }),

                stepPositive: new Listener( this.cockpitBus, 'plugin.cameraTilt.stepPositive', false, function()
                {
                    stepPositive();
                }),

                stepNegative: new Listener( this.cockpitBus, 'plugin.cameraTilt.stepNegative', false, function()
                {
                    stepNegative();
                }),

                setPosition: new Listener( this.cockpitBus, 'plugin.cameraTilt.set', false, function( degreesIn )
                {
                    setPosition( degreesIn );
                }),

                modifyPosition: new Listener( this.cockpitBus, 'plugin.cameraTilt.modify', false, function( degreesIn )
                {
                    modifyPosition( degreesIn );
                })
            }

            function stepPositive()
            {
                setPosition( self.tilt + 10 );
            }
            
            function stepNegative()
            {
                setPosition( self.tilt - 10 );
            }

            function modifyPosition( degreesIn )
            {
                setPosition( self.tilt + degreesIn );
            }

            function setPosition( degreesIn )
            {
                // Apply limits
                if( degreesIn > self.settings.positiveRange )
                {
                    self.tilt = self.settings.positiveRange;
                }
                else if( degreesIn < self.settings.negativeRange )
                {
                    self.tilt = self.settings.negativeRange;
                }
                else
                {
                    self.tilt = degreesIn;
                }

                // TODO: Eventually get float representations of the degrees mapped onto the wire, not servo commands
                var servoPos = parseInt( ( kMicrosecPerDegree * self.tilt ) + kZeroPosMicrosecs );

                // Emit command to mcu
                var command = 'tilt(' + servoPos + ')';
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
            this.listeners.setPosition.disable();
            this.listeners.modifyPosition.disable();
            this.listeners.stepPositive.disable();
            this.listeners.stepNegative.disable();
        }

        getSettingSchema()
        {
            //from http://json-schema.org/examples.html
            return [{
                'title': 'Camera Tilt',
                'type': 'object',
                'id': 'cameratilt',
                'properties': {
                    'stepResolution': {
                        'type': 'number',
                        'default': '10.0'
                    },
                    'positiveRange': {
                        'type': 'number',
                        'default': '31.8'
                    },
                    'negativeRange': {
                        'type': 'number',
                        'default': '-41.7'
                    },
                    'inverted': {
                    'type': 'boolean',
                    'format': 'checkbox',
                    'default': false
                    }
                },
                'required': [
                    'stepResolution',
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