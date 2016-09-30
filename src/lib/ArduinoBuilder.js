var path = require('path');
var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs-extra'));
var spawnAsync = require('child-process-promise').spawn;
var execAsync = require('child-process-promise').exec;


var ArduinoBuilder = function() {};

ArduinoBuilder.prototype.BuildSketch = function(options, onStdout, onStderr) {
    var buildOpts = [];
    var sketchOpt = '';
    var sketchName = '';
    var stagedSketchDir = '';
    var installDir = '';
    var hash = '';

    return Promise.try(function()
        {
            // Process the options passed in
            buildOpts = ProcessOptions(options);
            sketchName = path.basename(options.sketchDir);

            console.log('Processed options');

        })
        .then(function()
        {
            // Create temp build directory if it doesn't already exist
            return fs.mkdirsAsync(options.buildDir);
        })
        .then(function()
        {
            installDir = path.join(options.installBaseDir, options.productID);
            return fs.mkdirsAsync(installDir);
        })
        .then(function()
        {
            console.log('Made dirs');

            stagedSketchDir = path.join('/opt/openrov/firmware/staged/', sketchName);

            // Remove existing sketch folder if it exists
            return fs.removeAsync(stagedSketchDir)
                .then(function()
                {
                    // Copy the sketch folder to the staging sketch dir
                    return fs.copyAsync(options.sketchDir, stagedSketchDir);
                });
        })
        .then(function()
        {
          console.log('Removed old sketch');

          // Handle code generation, if requested
          if( options.generateCode )
          {
            // Generate preproc header file
            var output = '#pragma once\n\n';

            // Create defines
            for (i = 0; i < options.preproc.length; ++i)
            {
                output += '#define ' +
                    options.preproc[i].split('=')
                    .toString()
                    .replace(',', ' ') + '\n';
            }

            // Write CompileOptions.h file
            return fs.writeFileAsync(path.join(stagedSketchDir, 'CompileOptions.h'), output)
            .then( function()
            {
              console.log( 'Wrote CompileOptions.h' );

              var pluginDirs = GetDirectories('/opt/openrov/cockpit/src/plugins');
              var pluginString = '#pragma once\n\n';

              // Find all plugin folders and generate a Plugins.h file that pulls them in
              return Promise.map(pluginDirs, function(pluginName)
              {
                  var pluginDir = path.join('/opt/openrov/cockpit/src/plugins', pluginName);

                  // Check for a firmware folder
                  return fs.statAsync(path.join(pluginDir, 'firmware'))
                      .then(function()
                      {
                          // Copy all files to the sketch directory
                          return fs.copyAsync(path.join(pluginDir, 'firmware'), stagedSketchDir);
                      })
                      .then(function() 
                      {
                          // Add include for plugin to Plugins.h 
                          pluginString += '#include "' + pluginName + '.h"\n';
                      })
                      .catch(function(err) 
                      {
                        // Ignore errors. Most plugins don't have firmware folders and failing to copy a plugin isn't fatal
                      });
              })
              .then(function()
              {
                  // Write the generated include string to Plugins.h
                  return fs.writeFileAsync(path.join(stagedSketchDir, 'Plugins.h'), pluginString);
              });
            })
            .then( function()
            {
              // Generate a hash for everything in stagedSketchDir
              // TODO: Make this cross platform and not a linux command call
              return execAsync("find " + stagedSketchDir + " -name \\*.h -print0 -o -name \\*.hpp -print0 -o -name \\*.c -print0 -o -name \\*.cpp -print0 | xargs -0 sha1sum | sha1sum | awk '{print $1}'")
              .then( function (result) 
              {
                hash = result.stdout.trim();

                // Should look something like: "ver:<<{{10024121ae3fa7fc60a5945be1e155520fb929dd}}>>;"
                var hashDef = "#define VERSION_HASH F(\"ver:<<{{" + hash + "}}>>;\")\n";

                // Append a define to the compile options
                return fs.appendFileAsync( path.join(stagedSketchDir, 'CompileOptions.h'), hashDef );
              })
              
              // TODO:
              // Generate hash for the board core
              // Generate hash for all libraries used
              // Generate final hash for the combined generated hashes
            });
          }
        })
        .then(function()
        {
            buildOpts.push('-fqbn', options.fqbn);
            buildOpts.push(stagedSketchDir);

            console.log('Building with options:');
            console.log(buildOpts);

            // Create promise
            var promise = spawnAsync('arduino-builder', buildOpts);
            var childProcess = promise.childProcess;

            // Attach listeners
            childProcess.stdout.on('data', onStdout);
            childProcess.stderr.on('data', onStderr);

            return promise;
        })
        .then(function()
        {
            // Copy final binaries into install dir, whatever type they may be
            return Promise.any(
                [
                    fs.copyAsync(path.join(options.buildDir, sketchName + '.ino.bin'), path.join(installDir, sketchName + '.bin'))
                    .then(function()
                    {
                        return path.join(installDir, sketchName + '.bin');
                    }),
                    fs.copyAsync(path.join(options.buildDir, sketchName + '.ino.elf'), path.join(installDir, sketchName + '.elf'))
                    .then(function()
                    {
                        return path.join(installDir, sketchName + '.elf');
                    }),
                    fs.copyAsync(path.join(options.buildDir, sketchName + '.ino.hex'), path.join(installDir, sketchName + '.hex'))
                    .then(function()
                    {
                        return path.join(installDir, sketchName + '.hex');
                    })
                ]);
        })
        .then( function()
        {
            // Write the hash to file
            return fs.writeFileAsync( "/opt/openrov/system/config/lastBuildHash", hash );
        })
        .then(function(firmwareFile) 
        {
            console.log('SUCCESS');

            return Promise.try(function() 
            {
                    if (options.cleanAfterBuild) 
                    {
                        // Clean up temp dir
                        return fs.removeAsync(options.buildDir)
                            .then(function() 
                            {
                                return fs.removeAsync('/opt/openrov/firmware/staged');
                            });
                    }
                })
                .catch(function(error) 
                {
                    console.log("Strange error while trying to cleanup firmware staged files: " + error.message);
                })
                .then(function() 
                {
                    return firmwareFile;
                });

        })
        .catch(function(err) 
        {
            if (options.cleanAfterBuild)
            {
                // Clean up temp dir first
                return fs.removeAsync(options.buildDir)
                    .then(function() 
                    {
                        // Rethrow error
                        throw err;
                    });
            }
            else
            {
                throw err;
            }
        });
};

function ProcessOptions(options) 
{
    // First, validate required options
    ValidateOptions(options);

    var defaults = 
    {
        sketchDir: '',
        productID: '',
        buildDir: '/opt/openrov/firmware/build',
        installBaseDir: '/opt/openrov/firmware/bin',
        cleanAfterBuild: true,
        fqbn: '',
        hardware: '/opt/openrov/arduino/hardware',
        tools: '/opt/openrov/arduino/hardware/tools',
        warnings: 'all',
        verbose: true,
        quiet: false,
        debug: 5,
        libs: [],
        preproc: [],
        generateCode: true
    };

    // Override defaults with options
    options = options || {};

    for (var opt in defaults) 
    {
        if (defaults.hasOwnProperty(opt) && !options.hasOwnProperty(opt))
        {
            options[opt] = defaults[opt];
        }
    }
    // Create optArray
    var optArray = [];

    if (options.verbose) 
    {
        optArray.push('-verbose');
    }

    if (options.quiet) 
    {
        optArray.push('-quiet');
    }

    optArray.push('-compile');
    optArray.push('-warnings', options.warnings);
    optArray.push('-build-path', options.buildDir);
    optArray.push('-hardware', options.hardware);
    optArray.push('-tools', options.tools);

    for (i = 0; i < options.libs.length; ++i) 
    {
        optArray.push('-libraries', options.libs[i]);
    }

    return optArray;
}

function ValidateOptions(options) 
{
    // Required parameters
    if (IsBlank(options.sketchDir)) 
    {
        throw new Error('Missing required option: sketchDir');
    }

    if (IsBlank(options.productID)) 
    {
        throw new Error('Missing required option: productID');
    }

    if (IsBlank(options.installBaseDir)) 
    {
        throw new Error('Missing required option: installBaseDir');
    }

    if (IsBlank(options.fqbn)) 
    {
        throw new Error('Missing required option: fqbn');
    }
}

function IsBlank(str) {
    return !str || /^\s*$/.test(str);
}

function GetDirectories(dir) 
{
    return fs.readdirSync(dir)
        .filter(function(file) 
        {
            return fs.statSync(path.join(dir, file))
                .isDirectory();
        });
}

function HashDirectory( pathIn )
{
  
}

module.exports = new ArduinoBuilder();