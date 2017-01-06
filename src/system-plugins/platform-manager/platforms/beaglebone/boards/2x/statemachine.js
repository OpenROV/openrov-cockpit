const path              = require('path');
const Promise           = require('bluebird');
const retry             = require('bluebird-retry');
const fs                = Promise.promisifyAll(require('fs-extra'));
const StateMachine      = require('javascript-state-machine');

const BuildMCUFirmware  = require( "./lib/BuildMCUFirmware.js" );
const FlashMCUFirmware  = require( "./lib/FlashMCUFirmware.js" );
const FlashESCFirmware  = require( "./lib/FlashESCFirmware.js" );
const ResetMCU          = require( "./lib/ResetMCU.js" );

const escConfPath       = "/opt/openrov/system/config/esc.conf";
const mcuLastBuildPath  = "/opt/openrov/system/config/lastBuildHash";
const mcuBinPath        = "/opt/openrov/firmware/bin/2x/OpenROV2x.hex";
const logger            = require("AppFramework.js").logger.child({module:"stateMachine"});

module.exports = function( board ) 
{
    const Progress = Object.freeze( { "InProgress":1, "Complete":2, "Failed":3 } );

    function notify(message){
        board.global.emit("notification",message);
    }

    function status( message, progress )
    {
        board.global.emit( "plugin.updateManager.status", { message: message.toString(), progress: progress } );
        logger.debug( "FIRMWARE UPDATE: " + message.toString().trim() );
    }

    function log( data )
    {
        board.global.emit( "plugin.updateManager.log", data.toString() );
        logger.debug( "FIRMWARE UPDATE: " + data.toString().trim() );
    }

    function err( data )
    {
        board.global.emit( "plugin.updateManager.error", data.toString() );
        logger.error(data);
    }
    
    function escCheckHandler(event, from, to)
    {
        var self = this;

        status( "Checking ESCs...", "Examining" );

        // Check to see if ESCs have been flashed before by testing the existence of esc.conf
        fs.statAsync( escConfPath )
        .then( function()
        {
            // Existence of file suggests ESCs have been flashed already
            log( "ESCs already up to date." );
            self._e_esc_flash_complete();
        })
        .catch( function(error)
        {   
            // ESCs have never been flashed before. Do so now
            log( "ESCs haven't been flashed. Triggering flash." );
            self._e_trigger_esc_flash();
        });
    }

    function flashESCHandler(event, from, to)
    {
        var self = this;

        status( "Flashing ESCs...", "InProgress" );
        this.data.flashingAttemped = true;

        // First, disconnect the bridge
        self.board.bridge.close();

        // Execute the flash firmware script
        FlashESCFirmware( log, err )
        .then( function()
        {
            // Successm, write to a file to indicate this
            return fs.writeFileAsync( escConfPath, "flashed" );
        })
        .then( function()
        {   
            // Re-enable the bridge
            self.board.bridge.connect();

            // Success
            log( "ESCs flashed successfully." );
            self._e_esc_flash_complete();
        })
        .catch( function( error )
        {
            // Re-enable the bridge
            self.board.bridge.connect();

            // Move to failed state
            err( "ESC flash failed." );
            self._e_fail( error );
        });
    }

    function checkBinHandler(event, from, to)
    {
        var self = this;

        status( "Checking if firmware already built...", "Examining" );

        // Check to see if ESCs have been flashed before by testing the existence of esc.conf
        fs.statAsync( mcuBinPath )
        .then( function()
        {
            // Existence of file suggests firmware has already been built
            log( "Binary already exists" );
            self._e_firmware_build_complete();
        })
        .catch( function(error)
        {   
            // Firmware has never been built. Trigger a build
            log( "No binary found. Triggering build." );
            self._e_trigger_firmware_build();
        });
    }

    function buildFirmwareHandler(event, from, to)
    {
        status( "Building firmware...", "InProgress" );
        this.data.flashingAttemped = true;
        var self = this;

        // Execute the build firmware script
        BuildMCUFirmware( log, err )
        .then( function()
        {   
            // Success
            log( "Build succeeded" );
            self._e_firmware_build_complete();
        })
        .catch( function( error )
        {
            // Move to failed state
            err( "Build failed" );
            self._e_fail( error );
        });
    }

    function getHashHandler(event, from, to)
    {
        status( "Fetching firmware hash...", "Examining" );

        var self = this;

        // TODO: make this read from a file from somewhere else. Hex doesn't work for clever parsing :(
        fs.readFileAsync( mcuLastBuildPath, 'utf8' )
        .then( function( hash )
        {
            log( "Hash in last build file: " + hash.trim() );

            self.board.hashInfo.fromBin = hash;
        })
        .then( function()
        {   
            if( self.board.hashInfo.fromBin != "" )
            {
                // Success
                self._e_hash_obtained();
            }
            else
            {
                err( "Hash was empty!" );

                // Move to failed state
                self._e_fail( error );
            }
        })
        .catch( function( error )
        {
            err( "Failed to find hash file" );

            // Move to failed state
            self._e_fail( error );
        });
    }

    function flashMCUHandler(event, from, to)
    {
        status( "Flashing MCU firmware...", "InProgress" );
        this.data.flashingAttemped = true;
        var self = this;

        // Execute the build firmware script
        retry( function(){ return FlashMCUFirmware( log, err ); }, {interval: 10000})
        .then( function()
        {   
            // Success
            log( "Flash succeeded" );
            self._e_mcu_flash_complete();
        })
        .catch( function( error )
        {
            // Move to failed state
            log( "Flash failed" );
            self._e_fail( error );
        });
    }

    function verifyVersionHandler(event, from, to)
    {
        status( "Checking current firmware against latest...", "Examining" );

        var self = this;

        // First, clear out the existing fromMCU hash info
        self.board.hashInfo.fromMCU = "";

        // Now register a timeout that attempts to fetch the updated hash
        var counter = 0;

        var RequestHashInfo = function()
        {
            // Make sure the serial port is open
            if (!self.board.bridge.isConnected())
            {
                logger.debug("Serial Port not connected.. opening and retrying in 300ms");
                self.board.bridge.connect();
                setTimeout(RequestHashInfo.bind(this),300);
                return;
            }
            // Send the version request command to the MCU
            self.board.bridge.write( "version();" );

            log( "MCU reported hash: " + self.board.hashInfo.fromMCU );
            log( "Hash from last build: " + self.board.hashInfo.fromBin );

            // Check for new hash info received from MCU
            if( self.board.hashInfo.fromMCU !== "" )
            {
                // Check it against the binary hash
                if( self.board.hashInfo.fromMCU == self.board.hashInfo.fromBin )
                {  
                    // Success
                    log( "MCU Firmware is up to date" );
                    self._e_firmware_validated();
                }
                else
                {
                    // Version mismatch. Flash the latest firmware to the MCU
                    log( "MCU Firmware is out of date. Triggering flash." );
                    self._e_trigger_mcu_flash();
                }
            }
            else if( counter < 6 )
            {
                // Call 5 times, once per 3 secs
                counter++;
                log( "Verification attempt #" + counter );
                setTimeout( RequestHashInfo, 3000 );
            }
            else
            {
                // Never received hash info from MCU. Flash the latest firmware to the MCU
                log( "No firmware detected. Triggering flash." );
                self._e_trigger_mcu_flash();
            }
        };

        RequestHashInfo();
    }

    function resetMCUHandler(event, from, to)
    {
        status( "Resetting MCU...", "InProgress" );

        var self = this;

        ResetMCU()
        .then( function()
        {
            self._e_mcu_reset_complete();
        } )
        .catch( function( error )
        {
            // Move to failed state
            log( "Reset failed" );
            self._e_fail( error );
        });
    }

    function completeHandler(event, from, to)
    {
        status( "Firmware up to date!", "Complete" );
        if (this.data.flashingAttemped){
            notify( "Firmware update applied");
        }
        this.data.flashingAttemped = false;
    }

    function failHandler(event, from, to)
    {
        status( "Firmware update failed!", "Failed" );
        notify( "Firmware update failed");
        this.data.flashingAttemped = false;
    }

    function eFailHandler(event, from, to, msg) 
    {
        if( msg == undefined ) 
        {
            msg = 'No message in failure: ' + event;
        }

        err( "StateMachine error: " + msg );
        this.data.error = JSON.stringify( msg );
    };

    var fsm = StateMachine.create(
    {
        events: 
        [
            // Internal events - Should always be called as the final step of a promise chain
            { name: '_e_init',                          from: 'none',                               to: 'checking_escs' },
            { name: '_e_trigger_esc_flash',             from: 'checking_escs',                      to: 'flashing_escs' },
            { name: '_e_esc_flash_complete',            from: ['checking_escs','flashing_escs'] ,   to: 'checking_bin'},
            { name: '_e_trigger_firmware_build',        from: ['checking_bin','complete'],          to: 'building_firmware' },
            { name: '_e_firmware_build_complete',       from: ['checking_bin','building_firmware'], to: 'get_hash' },
            { name: '_e_hash_obtained',                 from: 'get_hash',                           to: 'verify_version' },    
            { name: '_e_trigger_mcu_flash',             from: 'verify_version',                     to: 'flashing_mcu' },
            { name: '_e_mcu_flash_complete',            from: 'flashing_mcu',                       to: 'verify_version' },
            { name: '_e_firmware_validated',            from: 'verify_version',                     to: 'complete' },
            { name: '_e_mcu_reset_complete',            from: 'resetting_mcu',                      to: 'complete' },

            // User events (can only be used from the complete state)
            { name: '_e_trigger_esc_flash_user',        from: 'complete',                           to: 'flashing_escs' },
            { name: '_e_trigger_firmware_build_user',   from: 'complete',                           to: 'building_firmware' },
            { name: '_e_trigger_mcu_flash_user',        from: 'complete',                           to: 'flashing_mcu' },
            { name: '_e_trigger_mcu_reset_user',        from: 'complete',                           to: 'resetting_mcu' },
            { name: '_e_reset',                         from: ['complete', 'failed'],               to: 'checking_escs' },

            { name: '_e_fail',                          from: '*',                                  to: 'failed' }
        ],

        callbacks: 
        {
            // State handlers - We allow states to handle their own transitions to ensure consistency
            onchecking_escs: escCheckHandler,
            onflashing_escs: flashESCHandler,
            onchecking_bin: checkBinHandler,
            onbuilding_firmware: buildFirmwareHandler,
            onflashing_mcu: flashMCUHandler,
            onget_hash: getHashHandler,
            onverify_version: verifyVersionHandler,
            onresetting_mcu: resetMCUHandler,
            oncomplete: completeHandler,
            onfailed: failHandler,

            // Event handlers
            onbefore_e_fail: eFailHandler
        },

        error: function(eventName, from, to, args, errorCode, errorMessage) 
        {
            // The error handler for the statemachine is backed with the above parameters, but since
            // some flows just raise an exception, need to move things around in that case.
            if (eventName instanceof Error) 
            {
                e = eventName;
                eventName = "unspecified";
            }

            errorReport = 
            {
                eventName: eventName,
                from: from,
                to: to,
                args: args,
                errorCode: errorCode,
                errorMessage: errorMessage,
            }

            err( 'MCU State Machine: Error in event <' + eventName + '>: ' + JSON.stringify(errorReport));
        }
    });

    // Other state information
    fsm.data = {};
    fsm.board = board;

    return fsm;
};
