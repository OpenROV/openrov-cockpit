var path = require('path');
var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs-extra'));
var ArduinoBuilder = require('/opt/openrov/cockpit/src/lib/ArduinoBuilder.js');
var opts = {
    sketchDir: '/opt/openrov/firmware/sketches/Trident',
    installBaseDir: '/opt/openrov/firmware/bin',
    productID: 'trident',
    cleanAfterBuild: true,
    fqbn: 'openrov:samd:trident',
    hardware: '/opt/openrov/arduino/hardware',
    tools: '/opt/openrov/arduino/hardware/tools',
    warnings: 'all',
    verbose: true,
    quiet: false,
    debug: 5,
    libs: [
      '/opt/openrov/arduino/hardware/openrov/samd/libraries',
      '/opt/openrov/firmware/libraries'
    ],
    preproc: [
      'MCUARCH=MCUARCH_SAMD',
      'CONTROLLERBOARD=CONTROLLERBOARD_TRIDENT',
      'VERSION_HASH=\"ver:<<{{0000000000000000000000000000000000000000}}>>;\"'
    ]
  };
ArduinoBuilder.BuildSketch(opts, function (data) {
  console.log(data.toString('utf8'));
}, function (data) {
  console.log(data.toString('utf8'));
});