const path              = require('path');
const Promise           = require('bluebird');
const retry             = require('bluebird-retry');
const fs                = Promise.promisifyAll(require('fs-extra'));
const StateMachine      = require('javascript-state-machine');

const FlashMCUFirmware  = require( "./lib/FlashMCUFirmware.js" );
const ResetMCU          = require( "./lib/ResetMCU.js" );

module.exports = function( board ) 
{
    const Progress = Object.freeze( { "InProgress":1, "Complete":2, "Failed":3 } );

    function notify(message){
        board.global.emit("notification",message);
    }

    function status( message, progress )
    {
        board.global.emit( "plugin.updateManager.status", { message: message.toString(), progress: progress } );
        console.log( "FIRMWARE UPDATE: " + message.toString().trim() );
    }

    function log( data )
    {
        board.global.emit( "plugin.updateManager.log", data.toString() );
        console.log( "FIRMWARE UPDATE: " + data.toString().trim() );
    }

    function err( data )
    {
        board.global.emit( "plugin.updateManager.error", data.toString() );
        console.error( "FIRMWARE UPDATE: " + data.toString().trim() );
    }

    function flashMCUHandler(event, from, to)
    {
        status( "Flashing MCU firmware...", "InProgress" );

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

    function resetMCUHandler(event, from, to)
    {
        console.log( "test" );
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
        notify( "Firmware update applied");
    }

    function failHandler(event, from, to)
    {
        status( "Firmware update failed!", "Failed" );
        notify( "Firmware update failed");
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
            { name: '_e_init',                          from: 'none',                               to: 'complete' },

            { name: '_e_mcu_flash_complete',            from: 'flashing_mcu',                       to: 'complete' },
            { name: '_e_mcu_reset_complete',            from: 'resetting_mcu',                      to: 'complete' },

            // User events (can only be used from the complete state)
            { name: '_e_trigger_mcu_flash_user',        from: 'complete',                           to: 'flashing_mcu' },
            { name: '_e_trigger_mcu_reset_user',        from: 'complete',                           to: 'resetting_mcu' },

            { name: '_e_reset',                         from: ['complete', 'failed'],               to: 'complete' },
            { name: '_e_fail',                          from: '*',                                  to: 'failed' }
        ],

        callbacks: 
        {
            // State handlers - We allow states to handle their own transitions to ensure consistency
            onflashing_mcu: flashMCUHandler,
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
