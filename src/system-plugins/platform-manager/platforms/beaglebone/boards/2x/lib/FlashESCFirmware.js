var path            = require( 'path' );
var Promise         = require( 'bluebird' );
var Retry           = require( 'bluebird-retry' );
var spawnAsync      = require( 'child-process-promise' ).spawn;
var ArduinoBuilder  = require( 'ArduinoBuilder' );

function Flash( onStdout, onStderr )
{
    // Build options for the 2x Afro FlashLoader firmware
    var buildOpts = 
    {
        sketchDir: '/opt/openrov/firmware/sketches/ArduinoUSBLinker',
        installBaseDir: '/opt/openrov/firmware/bin',
        productID: '2x',
        cleanAfterBuild: true,
        fqbn: 'openrov:avr:mega:cpu=atmega2560',
        hardware: '/opt/openrov/arduino/hardware',
        tools: '/opt/openrov/arduino/hardware/tools',
        warnings: 'all',
        verbose: true,
        quiet: false,
        debug: 5,
        libs: ['/opt/openrov/arduino/hardware/openrov/avr/libraries'],
        preproc: [],
        generateCode: false
    };

    // Run build, flash, upload process
    return ArduinoBuilder.BuildSketch( buildOpts, onStdout, onStderr )
    .then(function() 
    {
        var loaderFlashArgs     = [ '-P', '/dev/spidev1.0', '-c', 'linuxspi', '-vvv', '-p', 'm2560', '-U', 'flash:w:/opt/openrov/firmware/bin/2x/ArduinoUSBLinker.hex' ];
        var loaderFlashPromise  = spawnAsync('avrdude', loaderFlashArgs );
        var loaderFlashProcess  = loaderFlashPromise.childProcess;

        // Attach stdout and stderr listeners to the flashing process
        //loaderFlashProcess.stdout.on( 'data', onStdout );
        loaderFlashProcess.stderr.on( 'data', onStderr );

        // Execute the promise to spawn the flashing process
        return loaderFlashPromise;
    })
    .then( function()
    {
        var escFlasherArgs      = [ path.resolve( __dirname + "/FlashESCS.sh" ) ];
        var escFlasherPromise   = spawnAsync( 'bash', escFlasherArgs );
        var escFlasherProcess   = escFlasherPromise.childProcess;

        // Attach stdout and stderr listeners to the flashing process
        //escFlasherProcess.stdout.on( 'data', onStdout );
        escFlasherProcess.stderr.on( 'data', onStderr );

        // Now, try five times to flash the ESCs, every 5 seconds
        return Retry( function(){ return escFlasherPromise; }, { max_tries: 5, interval: 1000 })
    });
}

module.exports = Flash;