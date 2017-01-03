const Periodic = require( 'Periodic' );
const Listener = require( 'Listener' );

// Encoding helper functions
function encode( floatIn )
{
    return parseInt( floatIn * 1000 );
}

function decode( intIn )
{
    return ( intIn * 0.001 );
}

class IMU
{
    constructor( name, deps )
    {
        console.log( 'IMU plugin loaded' );
        var self = this;

        // Comm buses
        this.globalBus  = deps.globalEventLoop;
        this.cockpitBus = deps.cockpit;

        // Plugin settings
        this.settings = {};

        // Target settings
        this.targetRollOffset          = 0;
        this.targetRollOffset_enc      = 0;
        this.targetPitchOffset         = 0;
        this.targetPitchOffset_enc     = 0;

        // MCU's reported settings
        this.mcuRollOffset_enc         = NaN;
        this.mcuPitchOffset_enc        = NaN;
        this.zeroYawAck                = false;

        // IMU state information
        this.roll   = 0;
        this.pitch  = 0;
        this.yaw    = 0;

        // Periodic function that syncs current roll and pitch offsets with the MCU
        this.SyncSettings = new Periodic( 100, "timeout", function()
        {
            let synced = true;

            // Send target roll and pitch offsets until MCU is synced
            if( ( self.mcuRollOffset_enc !== self.targetRollOffset_enc ) ||
                ( self.mcuPitchOffset_enc !== self.targetPitchOffset_enc ) )
            {
                synced = false;

                // Encode floating point to integer representation
                var command = 'imu_level(' + self.targetRollOffset_enc + ',' + self.targetPitchOffset_enc + ')';

                // Emit command to mcu
                self.globalBus.emit( 'mcu.SendCommand', command );
            }

            // TODO: Max Attempts
            if( synced )
            {
                // No need to continue
                self.SyncSettings.stop();

                // Enable API
                self.listeners.zeroRollPitch.enable();
                self.listeners.zeroYaw.enable();
                self.listeners.clearRollPitchOffsets.enable();
            }
        });

        // Periodic function that commands the MCU to zero the yaw value of the IMU
        this.SyncZeroYaw = new Periodic( 100, "timeout", () =>
        {
            // TODO: Max Attempts
            if( self.zeroYawAck !== true )
            {
                // Emit command to mcu
                var command = 'imu_zyaw()';
                self.globalBus.emit( 'mcu.SendCommand', command );
            }
            else
            {
                // Stop syncing
                self.SyncZeroYaw.stop();
            }
        });

        this.listeners = 
        {
            settings: new Listener( this.globalBus, 'settings-change.imu', true, ( settings ) =>
            {
                // Apply settings
                self.settings = settings.imu;

                // Set new target positions
                self.targetRollOffset   = self.settings.rollOffset;
                self.targetPitchOffset  = self.settings.pitchOffset;

                // Encode offsets
                self.targetRollOffset_enc   = encode( self.targetRollOffset );
                self.targetPitchOffset_enc  = encode( self.targetPitchOffset );

                // Enable MCU Status listener
                self.listeners.mcuStatus.enable();

                // Start syncing the current settings with the MCU
                self.SyncSettings.start();
            }),

            mcuStatus: new Listener( this.globalBus, 'mcu.status', false, ( data ) =>
            {
                // Roll
                if( 'imu_r' in data ) 
                {
                    self.roll = decode( parseInt( data.imu_r ) );
                    self.globalBus.emit( "plugin.imu.roll", self.roll );
                }

                // Pitch
                if( 'imu_p' in data ) 
                {
                    self.pitch = decode( parseInt( data.imu_p ) );
                    self.globalBus.emit( "plugin.imu.pitch", self.pitch );
                }

                // Yaw
                if( 'imu_y' in data ) 
                {
                    self.yaw = decode( parseInt( data.imu_y ) );
                    self.globalBus.emit( "plugin.imu.yaw", self.yaw );
                }

                // Roll offset
                if( 'imu_roff' in data ) 
                {
                   self.mcuRollOffset_enc = parseInt( data.imu_roff );
                }

                // Pitch offset
                if( 'imu_poff' in data ) 
                {
                   self.mcuPitchOffset_enc = parseInt( data.imu_poff );
                }

                // Yaw zero ack
                if( 'imu_zyaw' in data ) 
                {
                   if( data.imu_zyaw == "ack" )
                   {
                       // Done syncing
                       self.zeroYawAck = true;
                   }
                }
            }),

            zeroRollPitch: new Listener( this.cockpitBus, 'plugin.imu.zeroRollPitch', false, () =>
            {
                // Zero the roll and pitch by using current values as offsets.
                self.setNewRollPitchOffsets();
            }),

            clearRollPitchOffsets: new Listener( this.cockpitBus, 'plugin.imu.clearRollPitchOffsets', false, () =>
            {
                // Zero the roll and pitch by using current values as offsets.
                self.clearRollPitchOffsets();
            }),

            zeroYaw: new Listener( this.cockpitBus, 'plugin.imu.zeroYaw', false, () =>
            {
                // Have the MCU zero the yaw value
                self.setZeroYaw();
            })
        }
    }

    clearRollPitchOffsets()
    {
        // Clear the offsets
        this.settings.rollOffset    = 0;
        this.settings.pitchOffset   = 0;

        // Update offset settings and send to settings manager, which will trigger a settings update
        this.cockpitBus.emit( 'plugin.settings-manager.saveSettings', { imu: this.settings } );
    }

    setNewRollPitchOffsets()
    {
        // Add current roll and pitch to existing offsets to mark this position as 'level'
        this.settings.rollOffset    += this.roll;
        this.settings.pitchOffset   += this.pitch;

        // Update offset settings and send to settings manager, which will trigger a settings update
        this.cockpitBus.emit( 'plugin.settings-manager.saveSettings', { imu: this.settings } );
    }

    setZeroYaw()
    {
        // Reset the ack and start syncing state
        this.zeroYawAck = false;
        this.SyncZeroYaw.start();
    }
    
    start()
    {
        this.listeners.settings.enable();
    }

    stop()
    {
        this.listeners.settings.disable();
        this.listeners.mcuStatus.disable();
        this.listeners.zeroRollPitch.disable();
        this.listeners.zeroYaw.disable();
        this.listerners.clearRollPitchOffsets.disable();

        this.SyncSettings.stop();
        this.SyncZeroYaw.stop();
    }

    getSettingSchema()
    {
        //from http://json-schema.org/examples.html
        return [{
            'title': 'IMU',
            'type': 'object',     
            'id': 'imu',
            'properties': {
                'rollOffset': {
                    'title': 'Roll Offset (deg)',
                    'type': 'number',
                    'default': 0.0
                },
                'pitchOffset': {
                    'title': 'Pitch Offset (deg)',
                    'type': 'number',
                    'default': 0.0
                }
            },
            'required': [
                "rollOffset",
                "pitchOffset"
            ]
        }];
    }
}

module.exports = function(name, deps) 
{
    return new IMU(name, deps);
};