var flasher = require('/opt/openrov/src/system-plugins/platform-manager/platforms/raspberrypi/cpu/EEPROMFlasher.js');

flasher( 'trident', 'rev9' )
.then( function(){ console.log( "EEPROM Successfully Flashed" ); }  )
.catch( function( err ){ console.log( "EEPROM Flash Failed: " + err.message ); } );