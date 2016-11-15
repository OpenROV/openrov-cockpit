const Listener      = require( "Listener" );
const Promise       = require( "bluebird" );
const Respawn       = require( "respawn" );

const log           = require( "debug" )( "app:camera:log" );
const error		    = require( "debug" )( "app:camera:error" );

const dLog		    = require( "debug" )( "app:daemon:log" );
const dError		= require( "debug" )( "app:daemon:error" );

class Camera
{
    constructor( serial, devicePath, wsPort, configuration )
    {
        // Camera properties
        this.serial     = serial;
        this.devicePath = devicePath;
        this.wsPort     = wsPort;
        this.alive      = true;

        // Config
        this.sslInfo    = configuration.sslInfo;
        this.settings   = configuration.cameraSettings;
        this.sioServer  = configuration.sioServer;
        this.eventBus   = configuration.eventBus;

        // Mock mode info
        this.useMock            = configuration.useMock;

        // Create process daemon
        this.daemon = Respawn( this.getDaemonCommand(),
        {
            name:           'mjpg-streamer',
            maxRestarts:    5,
            sleep:          5000
        });

        // Promisify start and stop
        this.daemon.startAsync  = Promise.promisify( this.daemon.start );
        this.daemon.stopAsync   = Promise.promisify( this.daemon.stop );

        // Set up daemon listeners
        this.daemon.on( "crash", () =>
        {
            dError( "Camera crashed too many times. Disabling." );

            // Camera has crashed too many times. Kill it.
            this.kill();
        });

        this.daemon.on( "stderr", (data) =>
        {
            dError( data.toString() );
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
                        resolution: 		this.settings.resolution, 
                        framerate: 			this.settings.framerate,
                        connectionType:     ( this.useMock ? "ws" : "wss" )
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

    getDaemonCommand()
    {
        if( this.useMock )
        {
            return [
                "nice", "--1",
                "mjpg_streamer",
                "-i", `input_uvc.so -r ${this.settings.resolution} -f ${this.settings.framerate} -d ${this.devicePath}`,
                "-o", `output_ws.so -p ${this.wsPort}`
            ];
        }
        else
        {
            // Uses SSL
            return [
                "nice", "--1",
                "mjpg_streamer",
                "-i", `input_uvc.so -r ${this.settings.resolution} -f ${this.settings.framerate} -d ${this.devicePath}`,
                "-o", `output_ws.so -p ${this.wsPort} -s -c ${this.sslInfo.certPath} -k ${this.sslInfo.keyPath}`
            ];
        }
    }

    start()
    {
        log( "Starting camera daemon" );
        return this.daemon.startAsync();
    }

    stop()
    {
        log( "Stopping camera daemon" );
        return this.daemon.stopAsync();
    }

    restart()
    {
        log( "Restarting camera daemon" );
        return this.stop()
                .then( () =>
                {
                    // Update the daemon command, in case settings changed
                    this.daemon.command = this.getDaemonCommand();
                })
                .then( () =>
                {
                    return this.start();
                });
    }

    kill()
    {
        this.alive = false;
    }
};

module.exports = Camera;