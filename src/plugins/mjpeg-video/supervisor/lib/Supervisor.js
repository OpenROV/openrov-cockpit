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
const log           = require( "debug" )( "app:supervisor:log" );
const error		    = require( "debug" )( "app:supervisor:error" );

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

        this.periodics = 
        {
            cameraCleanup: new Periodic( 5000, "timeout", () =>
            {
                for( var serial in this.cameras )
                {
                    if( this.cameras[ serial ] !== undefined && this.cameras[ serial ].alive === false )
                    {
                        return Promise.try( () =>
                        {
                            log( `Removing camera ${serial}` );
                            this.removeCamera( serial );
                        })
                        .catch( (err) =>
                        {
                            error( `Error removing camera: ${err.message}`);
                        })
                    }
                }
            }),

            broadcastRegistrations: new Periodic( 5000, "timeout", () =>
            {
                this.broadcastCameraRegistrations();
            })
        }
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

        // Start periodic functions
        this.periodics.cameraCleanup.start();
        this.periodics.broadcastRegistrations.start();

        // Start handling connections
        this.sioServer.on( "connection", client => 
        {
            log( "New mjpeg supervisor connection!" );

            // -----------------------
            // Public API

            client.on( "updateSettings", ( settings ) =>
            {
                // For now, update defaults and send to all cameras
                this.defaultCamSettings = settings;

                // Send settings update event
                this.eventBus.emit( "updateSettings", this.defaultCamSettings );
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
                return results.stdout.replace( /\t/g, '', "" )      // Trim away tabs
                    .split( "\n" )                                  // Split by lines
                    .filter( ( line ) => 
                    { 
                        // Return only the /dev/* lines
                        return ( line.indexOf( "/dev/" ) !== -1 ) 
                    } );
            })
            .then( (deviceFiles) =>
            {
                // Filter on MJPG capable cameras
                return Promise.filter( deviceFiles, (deviceFile) =>
                {
                    // List camera's supported formats
                    return execFileAsync( "v4l2-ctl", [ "--list-formats", "-d", deviceFile ] )
                        .then( (result) =>
                        {
                            // Return true if MJPG is a present format
                            return ( result.stdout.indexOf( "MJPG" ) !== -1 );
                        })
                        .catch( (err) =>
                        {
                            // Somehow this camera failed to provide a format using v4l2-ctl. Skip it.
                            error( `Error fetching formats for ${deviceFile}: ${err.message}`)
                            return false;
                        });
                });
            })
            .then( ( mjpgDevices ) =>
            {
                // Create new cameras for devices with valid serial numbers
                return Promise.map( mjpgDevices, ( device ) =>
                {
                    // Get device info
                    return execFileAsync( "udevadm", [ "info", "-a", "-n", device ] )
                        .then( ( results ) => 
                        {
                            // Parse serial number from results
                            return {    serial: results.stdout.match( /{serial}=="(.*)"/)[1],
                                        device: device }
                        })
                        .catch( (err) =>
                        {
                            // Skip
                            error( `Could not find serial number for camera[${device}]: ${err.message}` );
                        });
                })
                .map( (cameraInfo) =>
                {
                    return Promise.try( () =>
                    {
                        log( `Creating camera ${cameraInfo.serial}` );
                        this.createCamera( cameraInfo.serial, cameraInfo.device );
                    })
                    .catch( (err) =>
                    {
                        error( `Error creating camera: ${err.message}` );
                    });
                });     
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
            throw new Error( "Camera already exists" );
        }

        // Request a port
        let port = this.portPool.request();

        if( port )
        {
            // Create the camera
            this.cameras[ serial ] = new Camera( serial, devicePath, port, this.sslInfo, this.defaultCamSettings, this.sioServer, this.eventBus );

            // Start the camera
            this.cameras[ serial ].start();
        }
        else
        {
            throw new Error( "Could not create camera. Limit reached." );
        }
    }

    removeCamera( serial )
    {
        // Stop the camera
        return this.cameras[ serial ].stop()
            .then( ()=>
            {
                // Recycle port number
                this.portPool.recycle( this.cameras[ serial ].wsPort );

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