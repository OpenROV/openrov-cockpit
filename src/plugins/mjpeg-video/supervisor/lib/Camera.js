const Listener      = require( "Listener" );
const Promise       = require( "bluebird" );
const Respawn       = require( "respawn" );

class Camera
{
    constructor( devicePath, wsPort, sslInfo, defaultSettings, sioServer, eventBus )
    {
        // Camera properties
        this.devicePath = devicePath;
        this.wsPort     = wsPort;
        this.sslInfo    = sslInfo;
        this.settings   = defaultSettings;
        this.alive      = true;

        // Comm buses
        this.sioServer  = sioServer;
        this.eventBus   = eventBus;

        console.log( this.eventBus );

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
            // Camera has crashed too many times. Kill it.
            this.kill();
        });

        this.daemon.on( "stderr", (data) =>
        {
            console.error( data.toString() );
        });

        this.listeners = 
        {
            registration: new Listener( this.eventBus, "broadcastRegistration", false, () =>
            {
                if( this.alive === true )
                {
                    // Send registration message
                }
            }),

            settings: new Listener( this.eventBus, "updateSettings", false, ( settings ) =>
            {
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
        return [
            "nice", "-1",
            "mjpg_streamer",
            "-i", `input_uvc.so -r ${this.settings.resolution} -f ${this.settings.framerate} -d ${this.devicePath}`,
            "-o", `output_ws.so -p ${this.wsPort} -s -c ${this.sslInfo.certPath} -k ${this.sslInfo.keyPath}`
        ]
    }

    start()
    {
        return this.daemon.startAsync();
    }

    stop()
    {
        return this.daemon.stopAsync();
    }

    restart()
    {
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