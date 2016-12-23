// Dependencies
const Listener  = require( 'Listener' );

var log,error,debug;

class Video
{
    constructor( name, deps )
    {
        log = deps.logger.info.bind(deps.logger);
        error = deps.logger.error.bind(deps.logger);
        debug = deps.logger.debug.bind(deps.logger);        
        log( "Loaded Cockpit Plugin: Video" );

        this.globalBus  = deps.globalEventLoop;
        this.cockpitBus = deps.cockpit;
        this.cameras    = {};

        this.listeners = 
        {
            // TODO: Rename event
            streamRegistration: new Listener( this.globalBus, 'CameraRegistration', false, (data) =>
            {
                // Re-emit on cockpit bus
                this.cockpitBus.emit( 'CameraRegistration', data );
            })
        }
    }

    start()
    {
        // Set up listeners
        this.listeners.streamRegistration.enable();
    }

    stop()
    {
        this.listeners.streamRegistration.disable();
    }

    getSettingSchema()
    {
        return [
        {
            'title':        'Cameras & Video',
            'category' :    'video',
            'id':           'videosettings',
            'type':         'object',
            'properties': 
            {
                'show-stats': 
                {
                    'title':        'Show video player statistics',
                    'description':  'Overlays real-time data about the video on top of the video feed. Does not affect your recorded or streaming video feed.',
                    'id':           'show-stats',
                    'type':         'boolean',
                    'default':      false
                }
            }
        }];
    }
}

module.exports = function( name, deps ) 
{
    return new Video( name, deps );
};