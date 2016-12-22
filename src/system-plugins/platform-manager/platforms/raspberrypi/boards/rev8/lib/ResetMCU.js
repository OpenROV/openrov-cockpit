var execFileAsync   = require( 'child-process-promise' ).execFile;

function Reset()
{
   return execFileAsync( 'bash', [ "/opt/openrov/system/scripts/resetSAMD.sh" ] );
}

module.exports = Reset;