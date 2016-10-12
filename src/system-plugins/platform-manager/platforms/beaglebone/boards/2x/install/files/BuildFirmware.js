const Build = require( "/opt/openrov/cockpit/src/system-plugins/platform-manager/platforms/beaglebone/boards/2x/lib/BuildMCUFirmware.js" );

Build( function( data ){ console.log( data.toString() ); }, function( data ){ console.error( data.toString() ); } );