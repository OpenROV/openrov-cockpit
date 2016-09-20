const path = require('path');
const Promise = require('bluebird');
const retry = require('bluebird-retry');
const fs = Promise.promisifyAll(require('fs-extra'));
const spawnAsync = require('child-process-promise').spawn;
const execAsync = require('child-process-promise').exec;

const BuildFirmwareScript = "/opt/openrov/system/scripts/BuildFirmware.js";
const FlashFirmwareScript = "/opt/openrov/system/scripts/FlashFirmware.js";
const FlashESCScript = "/opt/openrov/system/scripts/FlashESCS.js";

const escConfPath = "/opt/openrov/system/config/esc.conf";
const mcuBinPath = "/opt/openrov/firmware/bin/2x/OpenROV2x.hex"

module.exports = function( board ) 
{
    var fsm = StateMachine.create(
    {
        initial: { state: 'startup', defer: true },

        events: 
        [
            // Internal events - Should always be called as the final step of a promise chain
            { name: '_e_trigger_esc_flash',             from: 'startup',                            to: 'flashing_escs' },
            { name: '_e_esc_flash_complete',            from: ['startup','flashing_escs'] ,         to: 'checking_bin'},
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
            { name: '_e_reset',                         from: ['complete', 'failed'],               to: 'startup' },

            { name: '_e_fail',                          from: '*',                                  to: 'failed' }
            
        ],

        callbacks: 
        {
            // State handlers - We allow states to handle their own transitions to ensure consistency
            onstartup: startupHandler,
            onflashing_escs: flashESCHandler,
            onchecking_bin: checkBinHandler,
            onbuilding_firmware: buildFirmwareHandler,
            onflashing_mcu: flashMCUHandler,
            onget_hash: getHashHandler,
            onverify_version: verifyVersionHandler,
            oncomplete: completeHandler,
            onfailed: failHandler

            // Event handlers
            onbefore_e_fail: eFailHandler
        },

        error: function(eventName, from, to, args, errorCode, errorMessage, e) 
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
                originalError: e.message,
                originalStack: e.stack
            }

            console.error( 'MCU State Machine: Error in event <' + eventName + '>: ' + JSON.stringify(errorReport));
        }
    });

    // Other state information
    fsm.data = {};

    return fsm;
};

var startupHandler = function startupHandler(event, from, to)
{
    var self = this;

    // Check to see if ESCs have been flashed before by testing the existence of esc.conf
    fs.statAsync( escConfPath )
    .then( function()
    {
        // Existence of file suggests ESCs have been flashed already
        self._e_esc_flash_complete();
    })
    .catch( function(error)
    {   
        // ESCs have never been flashed before. Do so now
        self._e_trigger_esc_flash();
    });
}

var flashESCHandler = function flashESCHandler(event, from, to)
{
    var self = this;

    // First, disconnect the bridge
    board.bridge.close();

    // Execute the flash firmware script
    execAsync( 'node', FlashESCScript )
    .then( function()
    {
        return fs.writeFileAsync( escConfPath, "flashed" );
    })
    .then( function()
    {   
        // Re-enable the bridge
        board.bridge.connect();

        // Success
        self._e_esc_flash_complete();
    })
    .catch( function( error )
    {
        // Re-enable the bridge
        board.bridge.connect();

        // Move to failed state
        self._e_fail( error );
    });
}

var checkBinHandler = function checkBinHandler(event, from, to)
{
    var self = this;

    // Check to see if ESCs have been flashed before by testing the existence of esc.conf
    fs.statAsync( mcuBinPath )
    .then( function()
    {
        // Existence of file suggests firmware has already been built
        self._e_firmware_build_complete();
    })
    .catch( function(error)
    {   
        // Firmware has never been built. Trigger a build
        self._e_trigger_firmware_build();
    });
}

var buildFirmwareHandler = function buildFirmwareHandler(event, from, to)
{
    var self = this;

     // Execute the build firmware script
    execAsync( 'node', BuildFirmwareScript )
    .then( function()
    {   
        // Success
        self._e_firmware_build_complete();
    })
    .catch( function( error )
    {
        // Move to failed state
        self._e_fail( error );
    });
}

var getHashHandler = function getHashHandler(event, from, to)
{
    var self = this;

     // Execute the build firmware script
    Promise.try( function()
    {
        // Execute a grep to 
    })
    .then( function()
    {   
        // Success
        self._e_firmware_build_complete();
    })
    .catch( function( error )
    {
        // Move to failed state
        self._e_fail( error );
    });
}



var eFailHandler = function eFailHandler(event, from, to, msg) 
{
  if( msg == undefined ) 
  {
    msg = 'No message in failure: ' + event;
  }

  trace( msg );
  this.data.error = JSON.stringify( msg );
};