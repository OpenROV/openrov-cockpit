var path = require('path');
var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs-extra'));
var ArduinoBuilder = require('/opt/openrov/cockpit/src/lib/ArduinoBuilder.js');
var opts = {
    sketchDir: '/opt/openrov/firmware/sketches/OpenROV2x',
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
    libs:     [
                '/opt/openrov/arduino/hardware/openrov/avr/libraries',
                '/opt/openrov/firmware/libraries'
              ],
    preproc:  [ 
                "MCUARCH=MCUARCH_AVR",
                "CONTROLLERBOARD=CONTROLLERBOARD_CB25",
                "VERSION_HASH=\"ver:<<{{0000000000000000000000000000000000000000}}>>;\"",
                "MPU9150_EEPROM_START=2"
              ]
  };
ArduinoBuilder.BuildSketch(opts, function (data) {
  console.log(data.toString('utf8'));
}, function (data) {
  console.log(data.toString('utf8'));
});