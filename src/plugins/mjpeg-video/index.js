(function() 
{
    const fs        = require('fs');
    const respawn   = require('respawn');
    const util      = require('util');
    const io        = require('socket.io-client');
    const assert    = require('assert');
    const Listener  = require( 'Listener' );

    var log         = require('debug')('app:log:mjpeg');
    var debug       = require('debug')('app:debug:mjpeg');
    var error       = require('debug')('app:error:mjpeg');

    var defaults = 
    {
        port: 8300,
        wspath: '/mjpeg-video'
    };

    class MjpgStreamer
    {
        constructor( name, deps )
        {
            log( "Loaded Cockpit Plugin: MjpgStreamer" );

            var self        = this;

            this.globalBus  = deps.globalEventLoop;
            this.cockpitBus = deps.cockpit;

            this.settings   = {};
            this.camera     = null;

            this.supervisor = io.connect( 'http://localhost:' + defaults.port, 
            {
                path: defaults.wspath,
                reconnection: true,
                reconnectionAttempts: Infinity,
                reconnectionDelay: 1000
            });

            this.supervisorLaunchOptions = 
            [
                "node",
                require.resolve( 'mjpeg-video-server' ),
                "-p",
                defaults.port,
                "-c",
                "/etc/openrov/STAR_openrov_net.chained.crt",
                "-k",
                "/etc/openrov/star_openrov_net.key",
            ];

            if( process.env.MJPG_MOCK === 'true' ) 
            {
                this.supervisorLaunchOptions.push( '-m' );
                this.supervisorLaunchOptions.push( 'true' );
            }

            this.svMonitor = respawn( this.supervisorLaunchOptions, 
            {
                name: 'mjpeg-video-server',
                env: 
                {
                    //'DEBUG': 'app*,camera*,channel*'
                },
                maxRestarts: -1,
                sleep: 1000
            });            

            // Set up listeners
            this.listeners = 
            {
                settings: new Listener( this.globalBus, 'settings-change.mjpegVideo', true, function( settings )
                {
                    try
                    {
                        // Check for settings changes
                        assert.notDeepEqual( settings.mjpegVideo, self.settings );

                        // Update settings
                        self.settings = settings.mjpegVideo;

                        // Send update to supervisor so it restarts the stream
                        self.supervisor.emit( "settingsChange", self.settings );
                    
                        // Emit settings update to cockpit
                        self.cockpitBus.emit( 'plugin.mjpegVideo.settingsChange', self.settings );
                    }
                    catch( err )
                    {
                        // Do nothing
                    }
                }),

                svConnect: new Listener( this.supervisor, 'connect', false, function()
                {
                    log( 'Successfully connected to mjpg-streamer supervisor' );

                    // Start listening for settings changes (gets the latest settings)
                    self.listeners.settings.enable();
                }),

                svDisconnect: new Listener( this.supervisor, 'disconnect', false, function()
                {
                    log( 'Disconnected from mjpg-streamer supervisor' );
                }),

                svError: new Listener( this.supervisor, 'error', false, function(err)
                {
                    error( 'Mjpg-streamer supervisor connection error: ' + err );
                }),

                svReconnect: new Listener( this.supervisor, 'reconnect', false, function()
                {
                    log('Reconnecting to mjpg-streamer supervisor...');
                }),

                svStreamRegistration: new Listener( this.supervisor, 'stream.registration', false, function( serial, info )
                {
                    log('Stream Registration: ' + JSON.stringify(info) );

                    // TODO: Lookup location based on serial ID

                    self.globalBus.emit( 'CameraRegistration', 
                    {
                        location:           info.txtRecord.cameraLocation,
                        videoMimeType:      info.txtRecord.videoMimeType,
                        resolution:         info.txtRecord.resolution,
                        framerate:          info.txtRecord.framerate,
                        wspath:             info.txtRecord.wspath,
                        relativeServiceUrl: info.txtRecord.relativeServiceUrl,
                        sourcePort:         info.port,
                        sourceAddress:      '',
                        connectionType:     'wss'
                    });
                })
            }
        }

        start()
        {
            // Start the supervisor process
            this.svMonitor.start();

            // Enable listeners
            this.listeners.svConnect.enable();
            this.listeners.svDisconnect.enable();
            this.listeners.svError.enable();
            this.listeners.svReconnect.enable();
            this.listeners.svStreamRegistration.enable();
        }

        stop()
        {
            // Stop the supervisor process
            this.svMonitor.stop();

            // Disable all listeners
            for( var listener in this.listeners ) 
            {
                if( this.listeners.hasOwnProperty( listener ) ) 
                {
                    listener.disable();
                }
            }
        }

        getSettingSchema()
        {
            return [
            {
                'title':    'MJPEG Video',
                'type':     'object',
                'id':       'mjpegVideo',

                'properties': {
                    'port': 
                    {
                        'type': 'number',
                        'default': 8200
                    },
                    'fps': 
                    {
                        'type': 'string',
                        'enum': 
                        [
                            '30',
                            '15',
                            '10'
                        ],
                        'title': 'Framerate',
                        'default': '30'
                    },
                    'resolution': 
                    {
                        'type': 'string',
                        'enum': 
                        [
                            '1920x1080',
                            '1280x720',
                            '640x480'
                        ],
                        'title': 'Resolution',
                        'default': '1280x720'
                    }                    
                },

                'required': 
                [
                    'port',             // Port to host websocket server on
                    'fps',              // Framerate setting for camera
                    'resolution'        // Resolution setting for camera
                ]
            }];
        }
    }

    module.exports = function( name, deps ) 
    {
        return new MjpgStreamer( name, deps );
    };
}());