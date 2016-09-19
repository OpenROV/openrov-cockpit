var path = require('path');
var Promise = require('bluebird');
var Retry = require('bluebird-retry');
var fs = Promise.promisifyAll(require('fs-extra'));
var execFileAsync = require('child-process-promise')
    .execFile;
var ArduinoBuilder = require('/opt/openrov/cockpit/src/lib/ArduinoBuilder.js');


var buildOpts = {
    sketchDir: '/opt/openrov/firmware/sketches/ArduinoUSBLinker',
    installBaseDir: '/opt/openrov/firmware/bin',
    productID: '2x',
    cleanAfterBuild: true,
    fqbn: 'openrov:avr:mega:cpu=atmega2560',
    hardware: '/opt/openrov/arduino/hardware',
    tools: '/opt/openrov/arduino/hardware/tools',
    warnings: 'none',
    verbose: true,
    quiet: false,
    debug: 5,
    libs: ['/opt/openrov/arduino/hardware/openrov/avr/libraries'],
    preproc: [],
    generateCode: false
};

var mcuFlashArgs = [ '-P', '/dev/spidev1.0', '-c', 'linuxspi', '-vvv', '-p', 'm2560', '-U', 'flash:w:/opt/openrov/firmware/bin/2x/ArduinoUSBLinker.hex' ];

// Create promise for flashing the MCU
var mcuFlashPromise = execFileAsync('avrdude', flashArgs );
var mcuFlashChildProcess = promise.childProcess;

// Attach listeners to flashing process
mcuFlashChildProcess.stdout.on('data', function(stdout) 
{
    console.log(stdout.toString('utf8'));
});

mcuFlashChildProcess.stderr.on('data', function(stderr) 
{
    console.error(stderr.toString('utf8'));
});

// Create promise for flashing the ESCs themselves
var escFlashPromise = execFileAsync('sh', "/opt/openrov/system/scripts/FlashESCS.sh" );
var escFlashChildProcess = escFlashPromise.childProcess;

// Attach listeners to flashing process
escFlashChildProcess.stdout.on('data', function(stdout) 
{
    console.log(stdout.toString('utf8'));
});

escFlashChildProcess.stderr.on('data', function(stderr) 
{
    console.error(stderr.toString('utf8'));
});

// Run build, flash, upload process
ArduinoBuilder.BuildSketch( buildOpts, function(data) 
  {
      console.log(data.toString('utf8'));
  }, function(data) {
      console.log(data.toString('utf8'));
  })
.then(function() 
{
  return mcuFlashPromise;
})
.then( function()
{
  // Now, try five times to flash the ESCs, every 5 seconds
  return retry( escFlashPromise, { max_tries: 5, interval: 5000 });
})
.then( function()
{
    console.log( "Success!" );
})