var Promise     = require( 'bluebird' );
var spawnAsync  = require( 'child-process-promise' ).spawn;

function Flash( onStdout, onStderr )
{
    var flashArgs = 
    [ 
        '-f', 
        '/usr/share/openocd/scripts/board/openrov_trident_samd.cfg', 
        '-c', 
        'program /opt/openrov/firmware/apps/trident/bin/openrov-trident-rev9/trident.bin; reset; exit' 
    ];

    var flashPromise  = spawnAsync('openocd', flashArgs );
    var flashProcess  = flashPromise.childProcess;

    // Attach stdout and stderr listeners to the flashing process
    flashProcess.stdout.on( 'data', onStdout );
    flashProcess.stderr.on( 'data', onStderr );

    return flashPromise;
}

module.exports = Flash;