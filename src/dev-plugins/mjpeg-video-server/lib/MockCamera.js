const Listener          = require( "Listener" );
const Promise           = require( "bluebird" );
const Respawn           = require( "respawn" );
const path              = require( "path" );
const WebSocketServer   = require( "ws" ).Server;
const Periodic          = require( "Periodic" );
const fs 		        = Promise.promisifyAll( require( "fs" ) );

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

class MockCamera
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

        // Mock image properties
        this.imagePath          = path.join( __dirname, "../mock-images" );
        this.mockImages         = [];
        this.lastFrameIndex     = 0;

        // Create websocket server
        this.wsServer   = new WebSocketServer( { port: wsPort } );

        // Create broadcast periodic
        this.broadcastFrame = new Periodic( framePeriod, "timeout", () =>
        {
            let nextFrameIndex = this.lastFrameIndex + 1;

            // Reset frame index if we reached the end
            if( nextFrameIndex >= this.mockImages.length ) 
            {
                nextFrameIndex = 0;
            }

            // Load image
            fs.readFileAsync( path.join( this.imagePath, this.mockImages[ nextFrameIndex ] ) )
                .then( ( image ) =>
                {
                    //log( `Sending frame ${nextFrameIndex}`);

                    // Broadcast the image to each connected client
                    this.wsServer.clients.forEach( (client) =>
                    {
                        client.send( image );
                    });

                    this.lastFrameIndex = nextFrameIndex;
                })
                .catch( (err) =>
                {
                    error( `Failed to send frame: ${err.message}` );
                });
        });

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
                        connectionType:     "ws"
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
            // Load images if necessary
            if( this.mockImages.length === 0 )
            {
                // Test path existence
                return fs.statAsync( this.imagePath )
                    .then( () =>
                    {
                        // Get list of jpg/jpegs
                        return fs.readdirAsync( this.imagePath )
                            .filter( (filename) =>
                            {
                                // Filter out non-jpegs
                                var ext = filename.split('.').pop().toLowerCase();
                                return supportedFormats.indexOf( ext ) > 0;
                            })
                            .then( (filenames) =>
                            {
                                if( filenames.length === 0 )
                                {
                                    throw new Error( "No jpeg images found in mock image path" );
                                }
                                else
                                {
                                    // Sort the filenames
                                    this.mockImages = filenames.sort();
                                }
                            });
                    })
            }
        })
        .then( () =>
        {
            // Start broadcasting
            this.broadcastFrame.start();
        })
        .catch( (err) =>
        {
            error( `Failed to start mock camera stream: ${err.message}` );
        });
    }

    stop()
    {
        return Promise.try( () =>
        {
            // Stop broadcasting
            this.broadcastFrame.stop();
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

module.exports = MockCamera;