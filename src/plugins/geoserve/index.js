var logger;

const exec = require('child_process').exec;
const fs = require('fs');
const path = require('path');
const respawn = require('respawn');

var geoserve = function geoserve(name, deps) 
{
    logger= deps.logger;

    logger.info('The geoserve plugin.');

    var self    = this;
    this.deps   = deps;

    var global  = deps.globalEventLoop;
    var cockpit = deps.cockpit;
}

// This gets called when plugins are started
geoserve.prototype.start = function start() 
{
    logger.info('Starting geoserve program');
    var geoprogram = 'geoserve';

    var launch_options = [];

    if( process.env.USE_MOCK != 'true' )
    {
        //Don't use platform specific nice in mock mode
        launch_options= launch_options.concat([
        'nice',
        '--19'     
        ])
    }

    // Create all launch options
   launch_options = launch_options.concat([
        geoprogram
   ]);

    const infinite = -1;

    // Set up monitor with specified options
    var monitor = respawn(launch_options, 
    {
        name: 'geoserve',
        maxRestarts: infinite,
        sleep: 1000
    });

    monitor.on('exit', function(code, signal) 
    {
        logger.error('Geoserve exited. Code: [' + code + '] Signal: [' + signal + ']');
    });

    monitor.on('stdout', function(data) 
    {
        var msg = data.toString('utf-8');
        logger.debug('Geoserve STDOUT: ' + msg);
    });

    monitor.on('stderr', function(data) 
    {
        var msg = data.toString('utf-8');
        logger.debug('Geoserve STDERR: ' + msg);
    });

    // Start the monitor
    monitor.start();
};

//Export provides the public interface
module.exports = function(name, deps) 
{
    return new geoserve(name, deps);
};
