var Promise     = require( 'bluebird' );
var spawnAsync  = require( 'child-process-promise' ).spawn;

function Flash( onStdout, onStderr )
{
    var flashArgs     = [ '-P', '/dev/spidev1.0', '-c', 'linuxspi', '-vvv', '-p', 'm2560', '-U', 'flash:w:/opt/openrov/firmware/bin/2x/OpenROV2x.hex' ];
    var flashPromise  = spawnAsync('avrdude', flashArgs );
    var flashProcess  = flashPromise.childProcess;

    // Attach stdout and stderr listeners to the flashing process
    //flashProcess.stdout.on( 'data', onStdout );
    //flashProcess.stderr.on( 'data', onStderr );

    return flashPromise;
}

module.exports = Flash;