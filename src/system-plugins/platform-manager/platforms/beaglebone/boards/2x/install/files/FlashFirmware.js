var path = require('path');
var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs-extra'));
var execFileAsync = require('child-process-promise')
    .execFile;

var args = [
    '-P',
    '/dev/spidev1.0',
    '-c',
    'linuxspi',
    '-vvv',
    '-p',
    'm2560',
    '-U',
    'flash:w:/opt/openrov/firmware/bin/2x/OpenROV2x.hex'
];

console.log('Flashing MCU firmware...');

// Create promise
var promise = execFileAsync('avrdude', args);
var childProcess = promise.childProcess;

// Attach listeners
childProcess.stdout.on('data', function(stdout) {
    console.log(stdout.toString('utf8'));
});

childProcess.stderr.on('data', function(stderr) {
    console.error(stderr.toString('utf8'));
});

promise.then(function() {
    console.log('Success!');
});