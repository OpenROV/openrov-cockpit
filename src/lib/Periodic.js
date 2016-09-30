const Mode = Object.freeze( { "interval":1, "timeout":2, "scheduled":3 } );

class Periodic
{
    constructor( interval_ms, mode, func )
    {
        // Private members
        this._interval   = interval_ms;
        this._mode       = Mode[ mode ];
        this._isRunning  = false;
        this._func       = func;
        this._reference  = null;
    }

    // Private methods
    _runTimeout()
    {
        var self = this;

        if( self._isRunning )
        {
            self._func();
            self._reference = setTimeout( self._runTimeout.bind( self ), self._interval );
        }
    }

    _runInterval()
    {
        var self = this;

        if( self._isRunning )
        {
            self._func();

            this._reference = setInterval( function()
            {
                if( self._isRunning )
                {
                    self._func();
                }
            }, this._interval );
        }
    }

    // Public methods
    start()
    {
        if( !this._isRunning )
        {
            this._isRunning = true;

            switch( this._mode )
            {
                case Mode.timeout:
                {
                    this._runTimeout();
                    break;
                }

                case Mode.interval:
                {
                    this._runInterval();
                    break;
                }

                default:
                {
                    console.error( "Mode not implemented!" );
                    break;
                }
            }
        }
    }

    stop()
    {
        if( this._isRunning == true )
        {
            this._isRunning = false;

            if( this._reference )
            {
                switch( this._mode )
                {
                    case Mode.timeout:
                    {
                        clearTimeout( this._reference );
                        break;
                    }

                    case Mode.interval:
                    {
                        clearInterval( this._reference );
                        break;
                    }

                    default:
                    {
                        console.error( "Mode not implemented!" );
                        break;
                    }
                }
            }
        }
    }
}

module.exports = Periodic;