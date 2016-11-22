(function(window) 
{
    'use strict';
    class CameraServo 
    {
        constructor( cockpit )
        {
            console.log('CameraServo Plugin running');

            var self = this;
            self.cockpit = cockpit;

            self.settings = null;   // These get sent by the local model

            self.currentPos = 0.0;  // As reported by the local model
            self.targetPos = 0.0;   // As requested by this plugin

            self.currentStep = 0;   // Alternative representation of targetPos
            self.stepMap = {};      // Automatically generated mapping of integer "steps" to target positions

            this.actions = 
            {
                "plugin.cameraServo.stepPositive":
                {
                    description: 'Step camera up',
                    controls:
                    {
                        button:
                        {
                            down: function() {
                                cockpit.emit('plugin.cameraServo.stepPositive');
                            }
                        },
                    }

                },
                "plugin.cameraServo.center":
                {
                    description: 'Center camera',
                    controls:
                    {
                        button:
                        {
                            down: function() {
                                cockpit.emit('plugin.cameraServo.center');
                            }
                        }
                    }

                },
                "plugin.cameraServo.stepNegative":
                {
                    description: 'Step camera down',
                    controls:
                    {
                        button:
                        {
                            down: function() {
                                cockpit.emit('plugin.cameraServo.stepNegative');
                            }
                        }
                    }
                }
            };

            this.inputDefaults = 
            {
                keyboard: 
                {
                    q: { type: "button",
                         action: "plugin.cameraServo.stepPositive" },
                    a: { type: "button",
                         action: "plugin.cameraServo.center" },
                    z: { type: "button",
                         action: "plugin.cameraServo.stepNegative" }
                },
                gamepad: 
                {
                    Y: { type: "button",
                         action: "plugin.cameraServo.stepPositive" },
                    B: { type: "button",
                         action: "plugin.cameraServo.center" },
                    A: { type: "button",
                         action: "plugin.cameraServo.stepNegative" }
                }
            };
        };

        

        generateStepMap()
        {
            var self = this;

            // Clear previous map
            self.stepMap = {};

            // Set the center position
            self.stepMap[ 0 ] = 0.0;

            // Split positive and negative ranges into discrete steps, with a special step of 0 assigned to 0.0 position
            if( self.settings.rangeMax > 0 )
            {
                var steps = Math.ceil( self.settings.rangeMax / self.settings.stepResolution );

                // Set the final step to be the max range
                self.stepMap[ steps ] = self.settings.rangeMax;
                self.stepMap.max = steps;

                // Loop through the remaining steps (if any) and map them to positions
                for( var i =  1; i < steps; i++ )
                {
                    self.stepMap[ i ] = i * self.settings.stepResolution;
                }
            }

            if( self.settings.rangeMin < 0 )
            {
                var steps = Math.ceil( Math.abs( self.settings.rangeMin ) / self.settings.stepResolution );

                // Set the final step to be the max range
                self.stepMap[ -steps ] = self.settings.rangeMin;
                self.stepMap.min = -steps;

                // Loop through the remaining steps (if any) and map them to positions
                for( var i =  1; i < steps; i++ )
                {
                    self.stepMap[ -i ] = -i * self.settings.stepResolution;
                }
            }
        }

        calculateStepFromPos()
        {
            var self = this;

            // Transforms the current position angle into a discrete step, truncating partial steps to the closest previous step
            if( self.currentPos > 0 )
            {
                if( self.currentPos < self.settings.rangeMax )
                {
                    self.currentStep = Math.floor( self.currentPos / self.settings.stepResolution )
                }
                else
                {
                    self.currentStep = self.stepMap.max;
                }
            }
            else if( self.currentPos < 0 )
            {
                if( self.currentPos > self.settings.rangeMin )
                {
                    self.currentStep = -Math.floor( Math.abs( self.currentPos ) / self.settings.stepResolution )
                }
                else
                {
                    self.currentStep = self.stepMap.min;
                }
            }
            else
            {
                self.currentStep = 0;
            }

            // Handle cases where currentStep is calculated as -0
            if( Object.is( -0, self.currentStep ) )
            {
                self.currentStep = 0;
            }
        }

        updatePosition()
        {
            // Calculate the currentStep
            this.calculateStepFromPos();

            // Send request to local model
            this.cockpit.rov.emit( 'plugin.cameraServo.setTargetPos', this.targetPos );
        }

        updateStep()
        {
            // Update targetPos based on currentStep
            this.targetPos = this.stepMap[ this.currentStep ];

            // Send request to local model
            this.cockpit.rov.emit( 'plugin.cameraServo.setTargetPos', this.targetPos );
        }

        stepPositive()
        {
            // Increment step position if possible
            if( this.currentStep !== this.stepMap.max )
            {
                this.currentStep++;
            }

            // Update position based on new step
            this.updateStep();
        }

        stepNegative()
        {
            // Increment step position if possible
            if( this.currentStep !== this.stepMap.min )
            {
                this.currentStep--;
            }

            // Update position based on new step
            this.updateStep();
        }

        center()
        {
            // Set step position to 0
            this.currentStep = 0;

            // Update position based on new step
            this.updateStep();
        }

        min()
        {
            // Set step position to max negative step
            this.currentStep = this.stepMap[ this.stepMap.min ];

            // Update position based on new step
            this.updateStep();
        }

        max()
        {
            // Set step position to max positive step
            this.currentStep = this.stepMap[ this.stepMap.max ];

            // Update position based on new step
            this.updateStep();
        }

        getTelemetryDefinitions()
        {
            return [
            {
                name: 'cameraServo.currentPos',
                description: 'Actual camera servo position reported in degrees'
            },
            {
                name: 'cameraServo.targetPos',
                description: 'Requested camera servo position reported in degrees'
            }]
        };

        // This pattern will hook events in the cockpit and pull them all back
        // so that the reference to this instance is available for further processing
        listen() 
        {
            var self = this;

            // Listen for settings from the local model
            this.cockpit.rov.withHistory.on('plugin.cameraServo.settingsChange', function(settings)
            {
                // Copy settings
                self.settings = settings;

                // Generate the step map
                self.generateStepMap();

                // Update the current step based on the new stepMap
                self.calculateStepFromPos();
            });

            // Local Model currentPos
            this.cockpit.rov.withHistory.on('plugin.cameraServo.currentPos', function( position )
            {
                self.cockpit.emit( 'plugin.cameraServo.currentPos', position );
            });

            // Local Model targetPos
            this.cockpit.rov.withHistory.on('plugin.cameraServo.targetPos', function( position )
            {
                self.cockpit.emit( 'plugin.cameraServo.targetPos', position );
            });

            // API functions

            // stepPositive
            this.cockpit.on('plugin.cameraServo.stepPositive', function()
            {
                self.stepPositive();
            });

            // stepNegative
            this.cockpit.on('plugin.cameraServo.stepNegative', function()
            {
                self.stepNegative();
            });

            // center
            this.cockpit.on('plugin.cameraServo.center', function()
            {
                self.center();
            });

            // min
            this.cockpit.on('plugin.cameraServo.min', function()
            {
                self.min();
            });

            // max
            this.cockpit.on('plugin.cameraServo.min', function()
            {
                self.max();
            });

            // setTargetPos
            this.cockpit.on('plugin.cameraServo.setTargetPos', function( pos )
            {
                self.targetPos = pos;

                self.updatePosition();
            });
        };
    };

    // Add plugin to the window object and add it to the plugins list
    var plugins = namespace('plugins');
    plugins.CameraServo = CameraServo;
    window.Cockpit.plugins.push( plugins.CameraServo );

}(window));