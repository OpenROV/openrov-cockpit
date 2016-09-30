const path = require('path');
const Promise = require('bluebird');
const retry = require('bluebird-retry');
const fs = Promise.promisifyAll(require('fs-extra'));
const execFileAsync = require('child-process-promise').execFile;
const StateMachine = require('javascript-state-machine');

const BuildFirmwareScript = "/opt/openrov/system/scripts/BuildFirmware.js";
const FlashFirmwareScript = "/opt/openrov/system/scripts/FlashFirmware.js";
const FlashESCScript = "/opt/openrov/system/scripts/FlashESCS.js";

const escConfPath = "/opt/openrov/system/config/esc.conf";
const mcuBinPath = "/opt/openrov/system/config/lastBuildHash"

module.exports = function( board ) 
{
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

            // User events (can only be used from the complete state)
            { name: '_e_trigger_esc_flash_user',        from: 'complete',                           to: 'flashing_escs' },
            { name: '_e_trigger_firmware_build_user',   from: 'complete',                           to: 'building_firmware' },
            { name: '_e_trigger_mcu_flash_user',        from: 'complete',                           to: 'flashing_mcu' },
            { name: '_e_reset',                         from: ['complete', 'failed'],               to: 'checking_escs' },

            { name: '_e_fail',                          from: '*',                                  to: 'failed' }
            
        ],

        callbacks: 
        {
            // State handlers - We allow states to handle their own transitions to ensure consistency
            on_e_init: escCheckHandler,
            onflashing_escs: flashESCHandler,
            onchecking_bin: checkBinHandler,
            onbuilding_firmware: buildFirmwareHandler,
            onflashing_mcu: flashMCUHandler,
            onget_hash: getHashHandler,
            onverify_version: verifyVersionHandler,
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

            console.error( 'MCU State Machine: Error in event <' + eventName + '>: ' + JSON.stringify(errorReport));
        }
    });

    // Other state information
    fsm.data = {};
    fsm.board = board;

    return fsm;
};

var escCheckHandler = function escCheckHandler(event, from, to)
{
    var self = this;

    console.log( "BOARD STATE: Checking ESCs..." );

    // Check to see if ESCs have been flashed before by testing the existence of esc.conf
    fs.statAsync( escConfPath )
    .then( function()
    {
        // Existence of file suggests ESCs have been flashed already
        console.log( "BOARD STATE: ESCs already up to date." );
        self._e_esc_flash_complete();
    })
    .catch( function(error)
    {   
        // ESCs have never been flashed before. Do so now
        console.log( "BOARD STATE: ESCs haven't been flashed. Triggering flash." );
        self._e_trigger_esc_flash();
    });
}

var flashESCHandler = function flashESCHandler(event, from, to)
{
    var self = this;

    console.log( "BOARD STATE: Flashing ESCs..." );

    // First, disconnect the bridge
    self.board.bridge.close();

    // Execute the flash firmware script
    execFileAsync( "node", [ FlashESCScript ] )
    .then( function()
    {
        return fs.writeFileAsync( escConfPath, "flashed" );
    })
    .then( function()
    {   
        // Re-enable the bridge
        self.board.bridge.connect();

        // Success
        console.log( "BOARD STATE: ESCs flashed successfully." );
        self._e_esc_flash_complete();
    })
    .catch( function( error )
    {
        // Re-enable the bridge
        self.board.bridge.connect();

        // Move to failed state
        console.log( "BOARD STATE: ESC flash failed." );
        self._e_fail( error );
    });
}

var checkBinHandler = function checkBinHandler(event, from, to)
{
    var self = this;

    console.log( "BOARD STATE: Checking for existing firmware binary..." );

    // Check to see if ESCs have been flashed before by testing the existence of esc.conf
    fs.statAsync( mcuBinPath )
    .then( function()
    {
        // Existence of file suggests firmware has already been built
        console.log( "BOARD STATE: Binary already exists" );
        self._e_firmware_build_complete();
    })
    .catch( function(error)
    {   
        // Firmware has never been built. Trigger a build
        console.log( "BOARD STATE: No binary found. Triggering build." );
        self._e_trigger_firmware_build();
    });
}

var buildFirmwareHandler = function buildFirmwareHandler(event, from, to)
{
    console.log( "BOARD STATE: Building firmware..." );

    var self = this;

    // Execute the build firmware script
    execFileAsync( "node", [ BuildFirmwareScript] )
    .then( function()
    {   
        // Success
        console.log( "BOARD STATE: Build succeeded" );
        self._e_firmware_build_complete();
    })
    .catch( function( error )
    {
        // Move to failed state
        console.log( "BOARD STATE: Build failed" );
        self._e_fail( error );
    });
}

var getHashHandler = function getHashHandler(event, from, to)
{
    console.log( "BOARD STATE: Getting hash from firmware binary..." );

    var self = this;

    // TODO: make this read from a file from somewhere else. Hex doesn't work for clever parsing :(
    fs.readFileAsync( mcuBinPath, 'utf8' )
    .then( function( hash )
    {
        console.log( "BOARD STATE: Hash in last build file: " + hash.trim() );
        self.board.hashInfo.fromBin = hash;
    })
    .then( function()
    {   
        // Success
        self._e_hash_obtained();
    })
    .catch( function( error )
    {
        // Move to failed state
        self._e_fail( error );
    });
}

var flashMCUHandler = function flashMCUHandler(event, from, to)
{
    console.log( "BOARD STATE: Flashing firmware..." );

    var self = this;

    var flashFunc = function()
    {
        return execFileAsync( 'node', [ FlashFirmwareScript ] );
    }

    // Execute the build firmware script
    retry( flashFunc, {interval: 10000})
    .then( function()
    {   
        // Success
        console.log( "BOARD STATE: Flash succeeded" );
        self._e_mcu_flash_complete();
    })
    .catch( function( error )
    {
        // Move to failed state
        console.log( "BOARD STATE: Flash failed" );
        self._e_fail( error );
    });
}

var verifyVersionHandler = function verifyVersionHandler(event, from, to)
{
    console.log( "BOARD STATE: Verifying MCU firmware against latest binary..." );

    var self = this;

    // First, clear out the existing fromMCU hash info
    self.board.hashInfo.fromMCU = "";

    // Now register a timeout that attempts to fetch the updated hash
    var counter = 0;

    var RequestHashInfo = function()
    {
        // Send the version request command to the MCU
        self.board.bridge.write( "version();" );

        console.log( "BOARD STATE: MCU reported hash: " + self.board.hashInfo.fromMCU );
        console.log( "BOARD STATE: MCU reported hash: " + self.board.hashInfo.fromBin );

        // Check for new hash info received from MCU
        if( self.board.hashInfo.fromMCU !== "" )
        {
            // Check it against the binary hash
            if( self.board.hashInfo.fromMCU == self.board.hashInfo.fromBin )
            {  
                // Success
                console.log( "BOARD STATE: MCU Firmware is up to date" );
                self._e_firmware_validated();
            }
            else
            {
                // Version mismatch. Flash the latest firmware to the MCU
                console.log( "BOARD STATE: MCU Firmware is out of date. Triggering flash." );
                self._e_trigger_mcu_flash();
            }
        }
        else if( counter < 6 )
        {
            // Call 5 times, once per 3 secs
            counter++;
            console.log( "BOARD STATE: Verification attempt #" + counter );
            setTimeout( RequestHashInfo, 3000 );
        }
        else
        {
            // Never received hash info from MCU. Flash the latest firmware to the MCU
            console.log( "BOARD STATE: No firmware detected. Triggering flash." );
            self._e_trigger_mcu_flash();
        }
    };

    RequestHashInfo();
}

var completeHandler = function completeHandler(event, from, to)
{
    console.log( "BOARD STATE: Auto-update process complete." );
}

var failHandler = function failHandler(event, from, to)
{
    console.log( "BOARD STATE: Auto-update process failed." );
}

var eFailHandler = function eFailHandler(event, from, to, msg) 
{
  if( msg == undefined ) 
  {
    msg = 'No message in failure: ' + event;
  }

  console.error( "StateMachine error: " + msg );
  this.data.error = JSON.stringify( msg );
};