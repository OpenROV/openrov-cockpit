#!/usr/bin/env node

var flasher = require('/opt/openrov/cockpit/src/system-plugins/platform-manager/platforms/raspberrypi/cpu/EEPROMFlasher.js');

flasher( 'rev8' )
.then( function(){ console.log( "EEPROM Successfully Flashed" ); }  )
.catch( function( err ){ console.log( "EEPROM Flash Failed: " + err.message ); } );