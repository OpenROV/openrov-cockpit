var Promise   = require( 'bluebird' );
var fs        = Promise.promisifyAll( require('fs') );
var path      = require('path');
var Periodic  = require( 'Periodic' );
var debug = {};

var SetupCPUInterface = function( cpu ) 
{
  debug = cpu.debug;

  // Decorate the CPU interface with cpu specific properties
  cpu.stats = {};

  cpu.readCPUTemp = new Periodic( 1000, "timeout", () =>
  {
    return fs.readFileAsync('/sys/class/thermal/thermal_zone0/temp' )
      .then( ( result ) =>
      {
        let temp = parseInt( result, 10 ) / 1000;

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