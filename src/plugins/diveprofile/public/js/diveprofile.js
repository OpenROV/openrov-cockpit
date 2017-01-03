(function(window) 
{
    'use strict';
    class DiveProfile 
    {
        constructor( cockpit )
        {
            console.log('DiveProfile Plugin running');

            var self = this;
            self.cockpit = cockpit;

            this.actions =
            {
                'plugin.diveProfile.zeroDepth':
                {
                    description: 'Zero the depth gauge using the current depth as an offset',
                    controls:
                    {
                        button:
                        {
                            down: function()
                            {
                                self.zeroDepth();
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
                    "alt+d": { type: "button", action: 'plugin.diveProfile.zeroDepth' }
                }
            };
        };

        zeroDepth()
        {
            this.cockpit.rov.emit( "plugin.diveProfile.zeroDepth" );
        }

        getTelemetryDefinitions()
        {
            return [];
        };

        listen() 
        {
            var self = this;

            this.cockpit.on('plugin.diveProfile.zeroDepth', function()
            {
                self.zeroDepth();
            });

            this.cockpit.rov.withHistory.on( "plugin.diveProfile.waterType", function( waterType )
            {
                self.cockpit.emit( "plugin.diveProfile.waterType", waterType );
            } );
        };
    };

    var plugins = namespace('plugins');
    plugins.DiveProfile = DiveProfile;
    window.Cockpit.plugins.push( plugins.DiveProfile );

}(window));