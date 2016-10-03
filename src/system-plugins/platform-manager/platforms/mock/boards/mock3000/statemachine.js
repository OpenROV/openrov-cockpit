const path = require('path');
const Promise = require('bluebird');
const retry = require('bluebird-retry');
const fs = Promise.promisifyAll(require('fs-extra'));
const spawnAsync = require('child-process-promise').spawn;
const execAsync = require('child-process-promise').exec;
const StateMachine = require('javascript-state-machine');

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

    console.log( "MOCK: escCheckHandler" );

    self._e_trigger_esc_flash();
}

var flashESCHandler = function flashESCHandler(event, from, to)
{
    var self = this;

    console.log( "MOCK: flashESCHandler" );

    // First, disconnect the bridge
    //self.board.bridge.close();
    
    // Re-enable the bridge
    //self.board.bridge.connect();

    // Success
    self._e_esc_flash_complete();
  
}

var checkBinHandler = function checkBinHandler(event, from, to)
{
    var self = this;

    console.log( "MOCK: checkBinHandler" );

    self._e_trigger_firmware_build();
}

var buildFirmwareHandler = function buildFirmwareHandler(event, from, to)
{
    var self = this;

    console.log( "MOCK: buildFirmwareHandler" );

    // Success
    self._e_firmware_build_complete();
}

var getHashHandler = function getHashHandler(event, from, to)
{
    var self = this;

    console.log( "MOCK: getHashHandler" );

    Promise.try( function()
    {
        return "asdfasdfasdf;ver:<<{{10024121ae3fa7fc60a5945be1e155520fb929dd}}>>;dsfsdfsfdsdfsfddasdasd"
    })
    .then( function(data)
    {
        // Regex that finds the version string
        var regex = /ver[:]<<{{(.*)}}>>;/;
        var matches = regex.exec( data );

        return matches[1];
    })
    .then( function( hash )
    {
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
    var self = this;

    console.log( "MOCK: flashMCUHandler" );

    // Success
    self._e_mcu_flash_complete();
}

var verifyVersionHandler = function verifyVersionHandler(event, from, to)
{
    var self = this;

    console.log( "MOCK: verifyVersionHandler" );

    // First, clear out the existing fromMCU hash info
    self.board.hashInfo.fromMCU = "";

    // Now register a timeout that attempts to fetch the updated hash
    var counter = 0;

    var RequestHashInfo = function()
    {
        // Send the version request command to the MCU
        self.board.bridge.write( "version();" );

        // Check for new hash info received from MCU
        if( self.board.hashInfo.fromMCU !== "" )
        {
            // Check it against the binary hash
            if( self.board.hashInfo.fromMCU == self.board.hashInfo.fromBin )
            {  
                // Success
                self._e_firmware_validated();
            }
            else
            {
                // Version mismatch. Flash the latest firmware to the MCU
                self._e_trigger_mcu_flash();
            }
        }
        else if( counter < 6 )
        {
            // Call 6 times, once per 10 secs
            counter++;
            setTimeout( RequestHashInfo, 10000 );
        }
        else
        {
            // Never received hash info from MCU. Flash the latest firmware to the MCU
            self._e_trigger_mcu_flash();
        }
    };

    RequestHashInfo();
}

var completeHandler = function completeHandler(event, from, to)
{
    // Do nothing for now
    console.log( "MOCK: completeHandler" );
}

var failHandler = function failHandler(event, from, to)
{
    // Do nothing for now
    console.log( "MOCK: failHandler" );
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