var logger=require('AppFramework.js').logger;
class ObjectPool
{
    // Options
    // {number}     options.initialSize     The number of objects to pre-allocate
    // {number}     options.maxSize         Prevents creation of more objects than the number specified here
    // {function}   options.resetObject     A function that will turn a used, dirty object into a clean state

    constructor( options, createObjectFunc )
    {
        if( !createObjectFunc ) 
        {
            throw new Error( 'ObjectPool: No `createObject` function provided!' );
        }

        // Private
        this._pool          = [];
        this._createObject  = createObjectFunc;
        this._resetObject   = options.resetObject;
        this._maxSize       = options.maxSize || 0;
        this._totalCount    = 0;

        // Pre-allocate objects
        this.allocate( options.initialSize || 0 );

        logger.debug( `Max size: ${this._maxSize}` );
    };

    // Pre-allocates the pool with the specified number of objects
    allocate( size )
    {
        while( size-- ) 
        {
            if( this._maxSize === 0 || this._totalCount < this._maxSize )
            {
                this._totalCount++;

                this._pool.push( this._createObject() );
            }
            else
            {
                // No room left in pool
                throw new Error( "No room to allocate more objects in pool!" );
            }
        }
    }

    // Removes an object from the pool and hands it over to the caller. If the pool is empty, will create a new object.
    request() 
    {
        if( this._pool.length > 0 )
        {
            // Provide an existing resource
            return this._pool.pop();
        }
        else if( this._maxSize === 0 || this._totalCount < this._maxSize )
        {
            this._totalCount++;

            // Create new object
            return this._createObject();
        }
        else
        {
            // No resources available
            return null;
        }
    }

    // Takes back an object and puts it back into the pool
    recycle( object ) 
    {
        // If a resetObject function exist, reset the object to a default state
        if( this._resetObject ) 
        {
            this._resetObject( object );
        }

        // Place the object in the pool
        this._pool.push( object );
    }

    // Makes sure that the pool has at least the given size
    reserve( size )
    {
        var diff = size - this._totalCount;

        if( diff > 0 ) 
        {
            // Failure to allocate requested number of objects will throw
            this.allocate( diff );
        }
        else
        {
            // Do nothing. We won't delete existing objects
        }
    }
};

module.exports = ObjectPool;