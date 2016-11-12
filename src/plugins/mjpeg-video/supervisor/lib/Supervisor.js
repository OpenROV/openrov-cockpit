// Dependencies
const Promise       = require( "bluebird" );
const path		    = require( "path" );
const execAsync	    = require( "child-process-promise" ).exec;
const http          = require( "http" );
const SIOServer     = require( "socket.io" );
const ObjectPool    = require( "ObjectPool" );
const fs 		    = Promise.promisifyAll( require( "fs" ) );

// Logging utilities
const log           = require( "debug" )( "app:log" );
const error		    = require( "debug" )( "app:error" );

const maxCameras = 4;

class Supervisor
{
    constructor( settings )
    {
        // Initialize properties
        this.settings   = settings;
        this.httpServer = null;
        this.sioServer  = null;
        this.cameras    = {};

        // Create a pool of ports for the cameras to start daemons on
        let wsPort          = 8200;
        this.portPool       = new ObjectPool( { maxSize: maxCameras, initialSize: maxCameras }, () =>
        {
            // Create port and increment counter
            return wsPort++;
        });
    }

    run()
    {
        // Perform initial camera scan
        this.scanForCameras();

        // Create HTTP server
        this.httpServer = http.createServer();

        // Start listening on specified port
        this.httpServer.listen( this.settings.port, () =>
        {
            log( "HTTP Server listening on port: " + this.settings.port );
        });

        // Create Socket.IO server
        this.sioServer = SIOServer( this.httpServer, { origins: '*:*', path: "/mjpeg" } );   

        // Start handling connections
        this.sioServer.on( "connection", client => 
        {
            log( "New mjpeg supervisor connection!" );

            // -----------------------
            // Public API

            client.on( "updateSettings", ( settings ) =>
            {
                this.updateCameraSettings( settings );
            });

            client.on( "scan", () =>
            {
                this.scanForCameras();
            });

            client.on( "listCameras", () =>
            {
                this.sendCameraList( client );
            });

            client.on( "start", () =>
            {
                this.startCameras();
            });

            client.on( "stop", () =>
            {
                this.stopCameras();
            });

            client.on( "restart", () =>
            {
                this.restartCameras();
            });
        });        
    }

    updateCameraSettings( settings )
    {
        // Update settings for each camera
            // Restart cameras
    }

    // Search for new V4L devices with MJPEG support
    scanForCameras()
    {
        // v4l2-ctl --list-devices
            // Parse
            // Lookup serial numbers
            // If they are new, create new camera objects
            // Start new cameras
    }

    // Send camera information to a specific client
    sendCameraList( client )
    {
        // client.emit( "cameraList", cameras )
    }

    // Broadcast camera information to all clients
    broadcastCameraList()
    {
        // this.sioServer.emit( "cameraList", cameras )
    }

    startCamera( camera )
    {
        // Request a port
            // Camera.start( port )
        // Else
            // 
    }

    stopCamera( camera )
    {

    }

    restartCamera( camera )
    {

    }
}

module.exports = Supervisor;