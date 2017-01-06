var logger = require('AppFramework').logger;
class Listener
{
    constructor( bus, event, withHistory, func )
    {
        // Private members
        this.bus = bus;
        this.event = event;
        this.withHistory = withHistory;
        this.func = func;

        this.enabled = false;
    }

    enable()
    {
        if( this.enabled === false )
        {
            // Handle registration with history. If unsupported, fall back to normal registration
            if( this.withHistory )
            {
                if( this.bus.withHistory !== undefined )
                {
                    this.bus.withHistory.on( this.event, this.func );
                }
                else
                {
                    logger.warn( "EventEmitter doesn't support withHistory.on(). Using default on(): When registering event: " + this.event );
                    this.bus.on( this.event, this.func );
                }
            }
            else
            {
                this.bus.on( this.event, this.func );
            }

            this.enabled = true;
        }
    }

    disable()
    {
        if( this.enabled === true )
        {
            this.bus.off( this.event, this.func );
            this.enabled = false;
        }
    }
}

module.exports = Listener;