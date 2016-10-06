(function(window) 
{
    'use strict';
    class Example 
    {
        constructor( cockpit )
        {
            console.log('Example Plugin running');

            var self = this;
            self.cockpit = cockpit;

            self.settings = null;     // These get sent by the local model

            // Setup input handlers
            this.inputDefaults = 
            [
              {
                name: 'plugin.example.sayHello',
                description: 'Invoke the node plugins sayHello() API',
                defaults: 
                {
                  keyboard: 'alt+0'
                },
                down: function () 
                {
                  // Emit the sayHello message locally
                  cockpit.emit( 'plugin.example.sayHello' );
                }
              }
            ];
        };

        sayHello()
        {
          // Send the sayHello command to the node plugin
          this.cockpit.rov.emit( 'plugin.example.sayHello' );
        }

        getTelemetryDefinitions()
        {
            return [{
                name: 'example.message',
                description: 'The message sent from the example module in the MCU'
            }]
        };

        // This pattern will hook events in the cockpit and pull them all back
        // so that the reference to this instance is available for further processing
        listen() 
        {
            var self = this;

            // Listen for settings from the node plugin
            this.cockpit.rov.withHistory.on('plugin.example.settingsChange', function(settings)
            {
                // Copy settings
                self.settings = settings;

                // Re-emit on cockpit
                self.cockpit.emit( 'plugin.example.settingsChange', settings );
            });

            // Listen for response messages from the Node plugin
            this.cockpit.rov.withHistory.on('plugin.example.message', function( message )
            {
                // Log the message!
                console.log( "Example Plugin says: " + message );

                // Rebroadcast for other plugins and widgets in the browser
                self.cockpit.emit( 'plugin.example.message', message );
            });

            // Listen for sayHello requests from other plugins and widgets
            this.cockpit.on('plugin.example.sayHello', function()
            {
                self.sayHello();
            });
        };
    };

    // Add plugin to the window object and add it to the plugins list
    var plugins = namespace('plugins');
    plugins.Example = Example;
    window.Cockpit.plugins.push( plugins.Example );

}(window));