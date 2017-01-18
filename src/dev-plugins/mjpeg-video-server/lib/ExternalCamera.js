const Listener          = require( "Listener" );
const Promise           = require( "bluebird" );
const Respawn           = require( "respawn" );
const path              = require( "path" );
const WebSocketServer   = require( "ws" ).Server;
const log               = require( "debug" )( "app:camera:log" );
const error		        = require( "debug" )( "app:camera:error" );

const framerate         = 30;
const framePeriod       = ( 1000 / framerate );
const resolution        = "640x480";

const supportedFormats = 
[
  'jpg',
  'jpeg'
];

class ExternalCamera
{
    constructor( serial, wsPort, configuration )
    {
        // Camera properties
        this.serial     = serial;
        this.wsPort     = wsPort;

        this.alive      = true;

        // Config
        this.sioServer  = configuration.sioServer;
        this.eventBus   = configuration.eventBus;

        // Create websocket server
        this.wsServer   = new WebSocketServer( { port: wsPort } );

        this.listeners = 
        {
            registration: new Listener( this.eventBus, "broadcastRegistration", false, () =>
            {
                if( this.alive === true )
                {
                    log( "Sending registration" );

                    // Send registration message
                    this.sioServer.emit( "stream.registration", this.serial,
                    {
                        port:		        this.wsPort,
                        resolution: 		resolution, 
                        framerate: 			framerate,
                        connectionType:     "ws",
                        sourceAddress:      process.env.EXTERNAL_CAM_URL
                    });
                }
            }),

            settings: new Listener( this.eventBus, "updateSettings", false, ( settings ) =>
            {
                log( "Received camera settings update" );

                this.settings = settings;

                // Restart camera
                this.restart();
            })
        }

        this.listeners.registration.enable();
        this.listeners.settings.enable();
    };

    start()
    {
        return Promise.try( () => 
        {
            // Do nothing
        })
        .catch( (err) =>
        {
            error( `Failed to start external camera: ${err.message}` );
        });
    }

    stop()
    {
        return Promise.try( () =>
        {
            return;
        });   
    }

    restart()
    {
        return this.stop()
            .then( () =>
            {
                return this.start();
            } );
    }

    kill()
    {
        this.alive = false;
    }
};

module.exports = ExternalCamera;
