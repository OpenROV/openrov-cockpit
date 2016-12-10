var execFileAsync   = require( 'child-process-promise' ).execFile;

function Reset()
{
   return execFileAsync( 'bash', [ __dirname + "/ResetMCU.sh" ] );
}

module.exports = Reset;