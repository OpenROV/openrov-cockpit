const Periodic = require( "Periodic" );
const Listener = require( "Listener" );

class SystemGreeting
{
    constructor( name, deps )
    {
        console.log( "SystemGreeting plugin loaded" );

        this.globalBus        = deps.globalEventLoop;
        this.cockpitBus       = deps.cockpit;

        var wakeAttempts      = 0;
        var maxWakeAttempts   = 10;

        this.mcuStatusListener = new Listener( this.globalBus, 'mcu.status', false, ( data ) =>
        {
            // Listen for awake response
            if( 'awake' in data )
            {
                // Stop wakeup
                this.wakeMCU.stop();
                this.mcuStatusListener.disable();
            }
        });

        this.wakeMCU = new Periodic( 1000, "timeout", () =>
        {
            if( wakeAttempts < maxWakeAttempts )
            {
              // Emit wake command to mcu
              this.globalBus.emit( 'mcu.SendCommand', "wake()" );
              wakeAttempts++;
            }
            else
            {
              // Stop wakeup
              this.wakeMCU.stop();
              this.mcuStatusListener.disable();
            }
        });
    }
    
    start()
    {
      this.mcuStatusListener.enable();
      this.wakeMCU.start();
    }

    stop()
    {
      this.wakeMCU.stop();
      this.mcuStatusListener.disable();
    }

    getSettingSchema()
    {
        //from http://json-schema.org/examples.html
        return [{
            'title': 'System Greeting',
            'type': 'object',
            'managedBy': '_hidden',                
            'id': 'system-greeting',
            'properties': {},
            'required': []
        }];
    }
}

module.exports = (name, deps) =>
{
    return new SystemGreeting( name, deps );
}