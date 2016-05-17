// To eliminate hard coding paths for require, we are modifying the NODE_PATH to include our lib folder
var oldpath = '';
if(process.env['NODE_PATH']!==undefined)
{
    oldpath = process.env['NODE_PATH'];
}

// Just in case already been set, leave it alone
process.env['NODE_PATH'] = ( __dirname + '/modules:' + oldpath );
require('module').Module._initPaths();

var ArduinoHelper   = require('../../lib/ArduinoHelper.js');

// Load appropriate hardware constructor
var Hardware;

if( process.env.HARDWARE_MOCK == 'true' )
{
    Hardware = require( 'Hardware-mock.js' );
} 
else 
{
    Hardware = require( 'Hardware.js' );
}

var physicalInterface = function physicalInterface( name, deps ) 
{
    var self                = this;
  
    this.debug              = require('debug')( name );
    this.globalEventLoop    = deps.globalEventLoop;
    this.cockpit            = deps.cockpit;
    this.CONFIG             = deps.config;
    this.physics            = new ArduinoHelper().physics;
    this.hardware           = new Hardware( deps );
     
    this.firmwareVersion    = 0;
    this.Capabilities       = 0;
    this.statusdata         = {};
    
    this.settingsCollection = 
    {
        smoothingIncriment: 0,
        deadZone_min: 0,
        deadZone_max: 0,
        water_type: 0 // FreshWater
    };

    this.rovsys = 
    { 
        capabilities: 0 
    };
    
    // ----------------------------------------------------------------------
    // Register Hardware Event Handlers
    
    this.hardware.on( 'serial-recieved', function (data) 
    {
        self.globalEventLoop.emit( 'physicalInterface.serialRecieved', data);
    });

    this.hardware.on( 'status', function (status) 
    {
        // Clear old status data
        self.statusdata = {};

        // Copy new status data 
        for( var i in status ) 
        {
            self.statusdata[i] = status[i];
        }

        // Re-emit status data for other subsystems
        self.globalEventLoop.emit('physicalInterface.status', self.statusdata);

        // Firmware version
        if( 'ver' in status ) 
        {
            self.firmwareVersion = status.ver;
        }
         
        // Settings update   
        if( 'TSET' in status ) 
        {
            var setparts = status.settings.split(',');
            
            self.settingsCollection.smoothingIncriment    = setparts[0];
            self.settingsCollection.deadZone_min          = setparts[1];
            self.settingsCollection.deadZone_max          = setparts[2];
            self.settingsCollection.water_type            = setparts[3];
            
            self.globalEventLoop.emit( 'physicalInterface.firmwareSettingsReported', self.settingsCollection );
        }

        // Capability report
        if( 'CAPA' in status ) 
        {
            var s                   = self.rovsys;
            s.capabilities          = parseInt(status.CAPA);
            
            self.Capabilities = s.capabilities;
            self.globalEventLoop.emit( 'physicalInterface.rovsys', s );
        }

        // Command request
        if( 'cmd' in status ) 
        {
            // Re-emit all commands except ping
            if( status.com != 'ping(0)' )
            {
                self.globalEventLoop.emit( 'physicalInterface.command', status.cmd );
            }
        }

        // Log entry
        if( 'log' in status )
        {
        }

        // Initial boot notification
        if( 'boot' in status )
        {
            self.Capabilities = 0;
            self.updateSetting();
            self.requestSettings();
            self.requestCapabilities();
        }
    });
    
    // ----------------------------------------------------------------------
    // Register global event handlers
    
    this.globalEventLoop.on('physicalInterface.send', function( cmd ) 
    {
        self.send( cmd );
    });
    
    this.globalEventLoop.on('physicalInterface.sendMotorTest', function( port, starbord, vertical )
    {
        self.sendMotorTest( port, starbord, vertical );
    });
    
    this.globalEventLoop.on('physicalInterface.registerPassthrough', function ( config ) 
    {
        self.registerPassthrough( config );
    });
       
    this.globalEventLoop.on('physicalInterface.startRawSerial', function () 
    {
        self.hardware.startRawSerialData();
    });

    this.globalEventLoop.on('physicalInterface.stopRawSerial', function () 
    {
        self.hardware.stopRawSerialData();
    });
    
    // ----------------------------------------------------------------------
    
    // Connect to the hardware
    this.hardware.connect();

    // Every few seconds we check to see if capabilities or settings changes on the arduino.
    // This handles the cases where we have garbled communication or a firmware update of the arduino.
    setInterval( function () 
    {
        if( self.notSafeToControl() === false ) 
        {
            return;
        }
        
        self.updateSetting();
        self.requestSettings();
        self.requestCapabilities();
    }, 1000);
};

physicalInterface.prototype.notSafeToControl = function () 
{
    // Arduino is OK to accept commands. After the Capabilities was added, all future updates require
    // being backward safe compatible (meaning you cannot send a command that does something unexpected but
    // instead it should do nothing).
    if( this.Capabilities !== 0 )
    {
        return false;
    }

    return true;
};

physicalInterface.prototype.requestCapabilities = function () 
{
    var command = 'rcap();';
    this.hardware.write( command );
};

physicalInterface.prototype.requestSettings = function () 
{
    //todo: Move to a settings manager
    var command = 'reportSetting();';
    this.hardware.write( command );
    
    command = 'rmtrmod();';
    this.hardware.write( command );
};

// TODO: Move the water setting to diveprofile
physicalInterface.prototype.updateSetting = function () 
{
    function watertypeToflag(type)
    {
        if(type=='fresh')
        {
            return 0;
        }

        return 1;
    }

    // This is the multiplier used to make the motor act linear fashion.
    // For example: the props generate twice the thrust in the positive direction than the negative direction.
    // To make it linear we have to multiply the negative direction * 2.
    var command = 'updateSetting('
        + this.CONFIG.preferences.get('smoothingIncriment') + ','
        + this.CONFIG.preferences.get('deadzone_neg') + ','
        + this.CONFIG.preferences.get('deadzone_pos') + ','
        + watertypeToflag( this.CONFIG.preferences.get('plugin:diveprofile:water-type')) + ');';
    
    this.hardware.write(command);
};


// --------------------------------
// Public interfaces
// -------------------------------

// TODO: Needs global listener
physicalInterface.prototype.send = function( cmd ) 
{
    var self = this;
    
    if( self.notSafeToControl() )
    {
        return;
    }

    var command = cmd + ';';
    self.hardware.write( command );
};

// TODO: Needs global listener
physicalInterface.prototype.sendMotorTest = function (port, starbord, vertical) 
{
    // The 1 bypasses motor smoothing
    var command = 'go(' + this.physics.mapRawMotor(port) + ',' +
        this.physics.mapRawMotor(vertical) + ',' +
        this.physics.mapRawMotor(starbord) + ',1)';
    
    this.send(command);
};

// TODO: Needs global listener
physicalInterface.prototype.registerPassthrough = function( config ) 
{
    var self = this;
    if(config) 
    {
        if(!config.messagePrefix) 
        {
            throw new Error('You need to specify a messagePrefix that is used to emit and receive message.');
        }

        var messagePrefix = config.messagePrefix;

        // Route specific status messages from the firmware to plugins interested in them
        if(config.fromROV) 
        {
            if(Array.isArray(config.fromROV)) 
            {
                config.fromROV.forEach(function(item) 
                {
                    self.globalEventLoop.on( 'physicalInterface.status', function (data) 
                    {
                        if(item in data) 
                        {
                            self.cockpit.emit( messagePrefix + '.' + item, data[item] );
                        }
                    });
                });
            }
            else 
            { 
                throw new Error('config.fromROV needs to be an array.'); 
            }
        }

        // Route commands to the hardware
        if( config.toROV ) 
        {
            if( Array.isArray( config.toROV ) ) 
            {
                config.toROV.forEach( function(item) 
                {
                    self.cockpit.on( messagePrefix + '.' + item, function(data) 
                    {
                        var args = Array.isArray(data) ? data.join() : data;
                        var command = item + '(' + args + ')';
                        self.send( command );
                    });
                });
            }
            else 
            { 
                throw new Error('config.toROV needs to be an array.');
            }
        }
    }
};

module.exports = function( name, deps )
{   
    return new physicalInterface( name, deps )
};
