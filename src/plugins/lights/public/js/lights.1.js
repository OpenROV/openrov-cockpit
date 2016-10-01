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

            // Setup input handlers
            this.inputDefaults = 
            [
              {
                name: 'plugin.lights.stepPositive',
                description: 'Makes the ROV lights brighter.',
                defaults: 
                {
                  keyboard: 'p',
                  gamepad: 'DPAD_UP'
                },
                down: function () 
                {
                  self.stepPositive();
                }
              },
              {
                name: 'plugin.lights.stepNegative',
                description: 'Makes the ROV lights dimmer.',
                defaults: 
                {
                  keyboard: 'o',
                  gamepad: 'DPAD_DOWN'
                },
                down: function () 
                {
                  self.stepNegative();
                }
              },
              {
                name: 'plugin.lights.toggle',
                description: 'Toggles the ROV lights on/off.',
                defaults: 
                { 
                  keyboard: 'i' 
                },
                down: function () 
                {
                  self.toggle();
                }
              }
            ];
        };

        stepPositive()
        {
          
        }

        stepNegative()
        {

        }

        off()
        {

        }

        on()
        {

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

            // setTargetPower
            this.cockpit.on('plugin.lights.setTargetPower', function( power )
            {
                self.targetPower = power;
            });
        };
    };

    // Add plugin to the window object and add it to the plugins list
    var plugins = namespace('plugins');
    plugins.Lights = Lights;
    window.Cockpit.plugins.push( plugins.Lights );

}(window));