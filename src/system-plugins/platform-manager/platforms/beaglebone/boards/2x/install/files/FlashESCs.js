const Flash = require( "/opt/openrov/cockpit/src/system-plugins/platform-manager/platforms/beaglebone/boards/2x/lib/FlashESCFirmware.js" );

Flash( function( data ){ console.log( data.toString() ); }, function( data ){ console.error( data.toString() ); } );