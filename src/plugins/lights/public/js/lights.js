(function(window) 
{
    'use strict';
    class Lights 
    {
        constructor( cockpit )
        {
            console.log('Lights Plugin running');

            var self = this;
            self.cockpit = cockpit;

            self.settings = null;     // These get sent by the local model

            self.currentPower = 0.0;  // As reported by the local model
            self.targetPower = 0.0;   // As requested by this plugin

            // Alternate representations of targetPower
            self.currentStep = 0;     
            self.isOn        = false;

            self.stepMap =
            {
                "0": 0.0,
                "1": 0.2,
                "2": 0.4,
                "3": 0.6,
                "4": 0.8,
                "5": 1.0,
                "min": 0,
                "max": 5
            }

            this.actions =
            {
                'plugin.lights.stepPositive':
                {
                    description: 'Make the ROV lights brighter.',
                    controls:
                    {
                        button:
                        {
                            down: function() {
                                cockpit.emit( 'plugin.lights.stepPositive' );
                            }                            
                        }
                    }
                },
                'plugin.lights.stepNegative':
                {
                    description: 'Make the ROV lights dimmer.',
                    controls:
                    {
                        button:
                        {
                            down: function() {
                                cockpit.emit( 'plugin.lights.stepNegative' );
                            }                            
                        }
                    }
                },
                'plugin.lights.toggle':
                {
                    description: 'Toggle the ROV lights on/off.',
                    controls:
                    {
                        button:
                        {
                            down: function() {
                                cockpit.emit( 'plugin.lights.toggle' );
                            }                            
                        }
                    }
                }
            };

            // Setup input handlers
            this.inputDefaults = 
            {
                keyboard: 
                {
                    ".": { type: "button",
                           action: 'plugin.lights.stepPositive' },
                    ",": { type: "button",
                           action: 'plugin.lights.stepNegative' },
                    "/": { type: "button",
                           action: 'plugin.lights.toggle' },
                },
                gamepad: 
                {
                    "DPAD_RIGHT": { type: "button",
                           action: 'plugin.lights.stepPositive' },
                    "DPAD_LEFT": { type: "button",
                           action: 'plugin.lights.stepNegative' },
                }
            };
               
        };

        updateFromStep()
        {
            // Update state
            if( this.currentStep != 0 )
            {
                this.isOn = true;
            }
            else
            {
                this.isOn = false;
            }

            // Update current power
            this.targetPower = this.stepMap[ this.currentStep ];

            // Send request to local model
            this.cockpit.rov.emit( 'plugin.lights.setTargetPower', this.targetPower );
        }

        updateFromState()
        {
            // Update step and power
            if( this.isOn )
            {
                this.currentStep = this.stepMap.max;
            }
            else
            {
                this.currentStep = this.stepMap.min;
            }

            this.targetPower = this.stepMap[ this.currentStep ];

            // Send request to local model
            this.cockpit.rov.emit( 'plugin.lights.setTargetPower', this.targetPower );
        }

        updateFromPower()
        {
            // Update step and state
            if( this.targetPower > 0.0 )
            {
                this.isOn = true;
            }
            else
            {
                this.isOn = false;
            }

            // Calculate closest step
            if( this.targetPower < 1.0 )
            {
                this.currentStep = Math.floor( this.targetPower / 0.2 )
            }
            else
            {
                this.currentStep = this.stepMap.max;
            }

            // Send request to local model
            this.cockpit.rov.emit( 'plugin.lights.setTargetPower', this.targetPower );
        }

        stepPositive()
        {
            this.currentStep++;

            // Bound
            if( this.currentStep > this.stepMap.max )
            {
                this.currentStep = this.stepMap.max;
            }

            this.updateFromStep();
        }

        stepNegative()
        {
            this.currentStep--;

            // Bound
            if( this.currentStep < this.stepMap.min )
            {
                this.currentStep = this.stepMap.min;
            }

            this.updateFromStep();
        }

        off()
        {
            // Update boolean rep
            this.isOn = false;

            this.updateFromState();
        }

        on()
        {    
            // Update boolean rep
            this.isOn = true;

            this.updateFromState();
        }

        toggle()
        {
            if( this.isOn === false )
            {
                this.on();
            }
            else
            {
                this.off();
            }
        }

        getTelemetryDefinitions()
        {
            return [
            {
                name: 'lights.currentPower',
                description: 'Light power as a percent'
            },
            {
                name: 'lights.targetPower',
                description: 'Requested light power as a percent'
            }]
        };

        // This pattern will hook events in the cockpit and pull them all back
        // so that the reference to this instance is available for further processing
        listen() 
        {
            var self = this;

            // Listen for settings from the local model
            this.cockpit.rov.withHistory.on('plugin.lights.settingsChange', function(settings)
            {
                // Copy settings
                self.settings = settings;
            });

            // Local Model currentPower
            this.cockpit.rov.withHistory.on('plugin.lights.currentPower', function( power )
            {
                // Update 
                self.currentPower = power;
                
                self.cockpit.emit( 'plugin.lights.currentPower', power );
            });

            // Local Model targetPower
            this.cockpit.rov.withHistory.on('plugin.lights.targetPower', function( power )
            {
                self.cockpit.emit( 'plugin.lights.targetPower', power );
            });

            // API functions

            // stepPositive
            this.cockpit.on('plugin.lights.stepPositive', function()
            {
                self.stepPositive();
            });

            // stepNegative
            this.cockpit.on('plugin.lights.stepNegative', function()
            {
                self.stepNegative();
            });

            // Off
            this.cockpit.on('plugin.lights.off', function()
            {
                self.off();
            });

            // On
            this.cockpit.on('plugin.lights.on', function()
            {
                self.on();
            });

            // Toggle
            this.cockpit.on('plugin.lights.toggle', function()
            {
                self.toggle();
            });

            // setTargetPower
            this.cockpit.on('plugin.lights.setTargetPower', function( power )
            {
                self.targetPower = power;
                self.updateFromPower();
            });
        };
    };

    // Add plugin to the window object and add it to the plugins list
    var plugins = namespace('plugins');
    plugins.Lights = Lights;
    window.Cockpit.plugins.push( plugins.Lights );

}(window));