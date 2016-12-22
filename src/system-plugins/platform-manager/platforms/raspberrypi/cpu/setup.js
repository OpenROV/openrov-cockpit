var Promise   = require( 'bluebird' );
var fs        = Promise.promisifyAll( require('fs') );
var path      = require('path');
var Periodic  = require( 'Periodic' );
var debug = {};

// I2C setup
var i2c       = require('i2c');
var lm75Address = 0x48;
var i2c1  = new i2c( lm75Address, { device: '/dev/i2c-1' } );

// Promisify the I2C read operation
var i2c1ReadAsync = Promise.promisify( i2c1.read, { context: i2c1 } );

var SetupCPUInterface = function( cpu ) 
{
  debug = cpu.debug;

  // Decorate the CPU interface with cpu specific properties
  cpu.stats = {};

  // Create periodic functions for reading CPU temp and LM75 temp
  cpu.readLM75Temp = new Periodic( 1000, "timeout", () =>
  {
    // Read two bytes to get the temperature bits
    return i2c1ReadAsync( 2 )
      .then( (result) =>
      {
        // First byte is temperature in C, first bit of second byte is equal to 0.5C
        let temp = result[ 0 ] + ( ( ( result[ 1 ] & 0x80 ) >> 7 ) * 0.5 );

        console.log( "LM75 TEMP: " + temp );

        // Emit on cockpit bus
        cpu.cockpit.emit( "cpu.temp.lm75", temp );
      })
      .catch( (err) =>
      {
        console.log( "Error reading LM75. Stopping task: " + err.message );
        cpu.readLM75Temp.stop();
      });
  });

  cpu.readCPUTemp = new Periodic( 1000, "timeout", () =>
  {
    return fs.readFileAsync('/sys/class/thermal/thermal_zone0/temp' )
      .then( ( result ) =>
      {
        let temp = parseInt( result, 10 ) / 1000;

        console.log( "CPU TEMP: " + temp );

        // Emit on cockpit bus
        cpu.cockpit.emit( "cpu.temp.rpi", temp );
      })
      .catch( ( err ) =>
      {
        // Error reading file. Stop reading it
        console.error( "Error reading cpu temp. Stopping read task: " + err.message );
        cpu.readCPUTemp.stop();
      });
  });

  // Start periodic tasks
  cpu.readLM75Temp.start();
  cpu.readCPUTemp.start();

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