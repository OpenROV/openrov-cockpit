// Dependencies
const Promise       = require( "bluebird" );
const path		    = require( "path" );
const execFileAsync = require( 'child-process-promise' ).execFile;
const http          = require( "http" );
const SIOServer     = require( "socket.io" );
const ObjectPool    = require( "ObjectPool" );
const Periodic      = require( "Periodic" );
const EventEmitter  = require( "eventemitter3" );
const fs 		    = Promise.promisifyAll( require( "fs" ) );

// Logging utilities
const log           = require( "debug" )( "app:log" );
const error		    = require( "debug" )( "app:error" );

const Camera        = require( "Camera" );
const maxCameras    = 4;

class Supervisor
{
    constructor( settings )
    {
        // Initialize properties
        this.settings   = settings;
        this.httpServer = null;
        this.sioServer  = null;
        this.eventBus   = new EventEmitter();
        this.cameras    = {};
        this.sslInfo    = 
        {
            certPath: this.settings.cert,
            keyPath: this.settings.key
        }

        this.defaultCamSettings =
        {
            framerate: 30,
            resolution: "1280x720"
        }

        // Create a pool of ports for the cameras to start daemons on
        let wsPort          = 8200;
        this.portPool       = new ObjectPool( { maxSize: maxCameras, initialSize: maxCameras }, () =>
        {
            // Create port and increment counter
            return wsPort++;
        });

        this.CameraCleanup = new Periodic( 5000, "timeout", () =>
        {
            for( var serial in this.cameras )
            {
                if( this.cameras[ serial ] !== undefined && this.cameras[ serial ].alive === false )
                {
                    log( `Removing camera ${serial}` );
                    this.removeCamera( serial );
                }
            }
        });
    }

    run()
    {
        // Create HTTP server
        this.httpServer = http.createServer();

        // Start listening on specified port
        this.httpServer.listen( this.settings.port, () =>
        {
            log( "HTTP Server listening on port: " + this.settings.port );
        });

        // Create Socket.IO server
        this.sioServer = SIOServer( this.httpServer, { origins: '*:*', path: "/mjpeg" } );

        // Perform initial camera scan
        this.scanForCameras();

        // Start camera cleanup periodic function
        this.CameraCleanup.start();

        // Start handling connections
        this.sioServer.on( "connection", client => 
        {
            log( "New mjpeg supervisor connection!" );

            // -----------------------
            // Public API

            client.on( "updateSettings", ( settings ) =>
            {
                // Send settings update event
                this.eventBus.emit( "updateSettings", settings );
            });

            client.on( "scan", () =>
            {
                this.scanForCameras();
            });

            client.on( "sendRegistrations", () =>
            {
                this.broadcastCameraRegistrations();
            });
        });        
    }

    // Search for new V4L devices with MJPEG support
    scanForCameras()
    {
        return execFileAsync( "v4l2-ctl", [ "--list-devices" ] )
                .then( ( results ) =>
                {
                    // Return list of V4L capable video device files
                    return results.stdout.replace( /\t/g, '', "" ).split( "\n" ).filter( ( line ) => { return ( line.indexOf( "/dev/" ) !== -1 ) } );
                })
                .then( (deviceFiles) =>
                {
                    // Filter on MJPG capable cameras
                    return Promise.filter( deviceFiles, (deviceFile) =>
                    {
                        return execFileAsync( "v4l2-ctl", [ "--list-formats", "-d", deviceFile ] )
                                .then( (result) =>
                                {
                                    return ( result.stdout.indexOf( "MJPG" ) !== -1 );
                                });
                    });
                })
                .then( ( mjpgDevices ) =>
                {
                    // Create new cameras for devices with valid serial numbers
                    return Promise.map( mjpgDevices, ( device ) =>
                    {
                        // Look up serial numbers for devices
                        return execFileAsync( "udevadm", [ "info", "-a", "-n", device ] )
                                .then( ( results ) => 
                                {
                                    // Parse serial number from results
                                    return results.stdout.match( /{serial}=="(.*)"/)[1];
                                })
                                .then( (serial) =>
                                {
                                    log( `Creating camera ${serial}` );
                                    this.createCamera( serial, device );
                                })
                                .catch( (err) =>
                                {
                                    // Skip
                                    error( `Could not create camera[${device}]: ${err.message}` );
                                });
                    });                  
                })
                .then( (cameras ) =>
                {
                    // Do stuff
                })
                .catch( (err) =>
                {
                    log( "No V4L cameras found." );
                });
    }

    createCamera( serial, devicePath )
    {
        if( this.cameras[ serial ] !== undefined )
        {
            log( "Camera already exists" );
            return;
        }

        // Request a port
        let port = this.portPool.request();

        if( port )
        {
            // Create the camera
            this.cameras[ serial ] = new Camera( devicePath, port, this.sslInfo, this.defaultCamSettings, this.sioServer, this.eventBus );

            // Start the camera
            this.cameras[ serial ].start();
        }
        else
        {
            error( "Could not create camera. Limit reached." );
        }
    }

    removeCamera( serial )
    {
        // Stop the camera
        this.cameras[ serial ].stop()
            .then( ()=>
            {
                // Remove from camera list (leaves the serial key, but deletes the structure)
                this.cameras[ serial ] = undefined;
            });

        // TODO: Unregistration?
    }

    // Broadcast camera information to all clients
    broadcastCameraRegistrations()
    {
        this.eventBus.emit( "broadcastRegistration" );
    }
}

module.exports = Supervisor;