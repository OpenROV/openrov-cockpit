const Promise   = require( 'bluebird' );
const fs        = Promise.promisifyAll( require('fs') );
const path      = require('path');
const i2c       = require('i2c');
const Periodic  = require( 'Periodic' );

const debug = {};

// I2C setup
var lm75Address = 0x48;
var i2c1  = new i2c( lm75Address, { device: '/dev/i2c-1' } );

// Promisify the I2C read operation
var i2c1ReadAsync = Promise.promisify( i2c1.read, { context: i2c1 } );

var SetupCPUInterface = function( cpu ) 
{
  var self = this;
  
  debug = cpu.debug;

  // Decorate the CPU interface with cpu specific properties
  cpu.stats = {};

  // Create periodic functions for reading CPU temp and LM75 temp
  self.readLM75Temp = new Periodic( 1000, "timeout", () =>
  {
    // Read two bytes to get the temperature bits
    return i2c1ReadAsync( 2 )
      .then( (result) =>
      {
        // First byte is temperature in C, first bit of second byte is equal to 0.5C
        let temp = result[ 0 ] + ( ( ( result[ 1 ] & 0x80 ) >> 7 ) * 0.5 );

        console.log( "LM75 TEMP: " + temp );

        // Emit on cockpit bus
        self.cockpit.emit( "cpu.temp.lm75", temp );
      })
      .catch( (err) =>
      {
        console.log( "Error reading LM75. Stopping task: " + err.message );
        self.readLM75Temp.stop();
      });
  });

  self.readCPUTemp = new Periodic( 1000, "timeout", () =>
  {
    return fs.readFileAsync('/sys/class/thermal/thermal_zone0/temp' )
      .then( ( result ) =>
      {
        let temp = parseInt( result, 10 ) / 1000;

        console.log( "CPU TEMP: " + temp );

        // Emit on cockpit bus
        self.cockpit.emit( "cpu.temp.rpi", temp );
      })
      .catch( ( err ) =>
      {
        // Error reading file. Stop reading it
        console.error( "Error reading cpu temp. Stopping read task: " + err.message );
        self.readCPUTemp.stop();
      });
  });

  // Start periodic tasks
  self.readLM75Temp.start();
  self.readCPUTemp.start();

  // ------------------------------------------------
  // Setup Public API	
  RegisterFunctions(cpu);

  // Call initialization routine
  cpu.global.emit('cpu.Initialize');
};

// ------------------------------------------------
// Public API Definitions	
// ------------------------------------------------
var RegisterFunctions = function( cpu ) 
{
  cpu.AddMethod('Initialize', function () 
  {
  }, false);
};

module.exports = SetupCPUInterface;