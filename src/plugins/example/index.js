(function() 
{
    const Listener = require( 'Listener' );

    class Example
    {
        constructor(name, deps)
        {
            console.log( 'Example plugin loaded!' );

            this.globalBus  = deps.globalEventLoop;   // This is the server-side messaging bus. The MCU sends messages to server plugins over this
            this.cockpitBus = deps.cockpit;           // This is the server<->client messaging bus. This is how the server talks to the browser

            this.hasSaidHello = false;

            var self = this;

            // Pre-define all of the event listeners here. We defer enabling them until later.
            // Look at src/libs/Listener.js to see how these work.
            this.listeners = 
            {
                // Listener for Settings updates
                settings: new Listener( self.globalBus, 'settings-change.example', true, function( settings )
                {
                    // Apply settings
                    self.settings = settings.example;

                    // Emit settings update to cockpit
                    self.cockpitBus.emit( 'plugin.example.settingsChange', self.settings );
                }),

                // Listener for MCU status messages
                mcuStatus: new Listener( self.globalBus, 'mcu.status', false, function( data )
                {
                    // Check for the example field name in the MCU's status update
                    if( 'example' in data ) 
                    {
                        // Get the message that the MCU sent to us
                        var message = data.example;

                        // Re-emit the message on the cockpit messaging bus (talks to the browser)
                        self.cockpitBus.emit( 'plugin.example.message', message );
                    }
                }),

                sayHello: new Listener( self.cockpitBus, 'plugin.example.sayHello', false, function( powerIn )
                {
                    var command;

                    // Create a command in the format "command( parameters )"
                    if( self.hasSaidHello )
                    {
                      command = 'ex_hello(' + 0 + ')';
                      self.hasSaidHello = false;
                    }
                    else
                    {
                      command = 'ex_hello(' + 1 + ')';
                      self.hasSaidHello = true;
                    }
                    
                    // Send command to mcu
                    self.globalBus.emit( 'mcu.SendCommand', command );
                })
            }
        }
        
        // This is automatically called when cockpit loads all of the plugins, and when a plugin is enabled
        start()
        {
          // Enable the listeners!
          this.listeners.settings.enable();
          this.listeners.mcuStatus.enable();
          this.listeners.sayHello.enable();
        }

        // This is called when the plugin is disabled
        stop()
        {
          // Disable listeners
          this.listeners.settings.disable();
          this.listeners.mcuStatus.disable();
          this.listeners.sayHello.disable();
        }

        // This is used to define user settings for the plugin. We populated some example properties below.
        // The UI for changing the settings is automatically generated in the Settings applet.
        getSettingSchema()
        {
            //from http://json-schema.org/examples.html
            return [{
                'title': 'Example Plugin',
                'type': 'object',
                'id': 'example',
                'properties': {
                  'firstName': {
                    'type': 'string',
                    'default': 'Open'
                  },
                  'lastName': {
                    'type': 'string',
                    'default': 'Rov'
                  },
                  'age': {
                    'description': 'Age in years',
                    'type': 'integer',
                    'minimum': 0
                  }
                },
                'required': [
                  'firstName',
                  'lastName'
                ]
            }];
        }
    }

    module.exports = function(name, deps) 
    {
        return new Example(name, deps);
    };
}());