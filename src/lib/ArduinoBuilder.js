var path 			= require( "path" );
var Promise			= require( "bluebird" );
var fs				= Promise.promisifyAll( require( "fs-extra" ) );
var spawnAsync 		= require('child-process-promise').spawn;

var ArduinoBuilder 	= function()
{
};

ArduinoBuilder.prototype.BuildSketch = function( options, onStdout, onStderr )
{
	var buildOpts 		= [];
	var sketchName		= "";
	var stagedSketchDir	= "";
	var installDir 		= "";
	
	return Promise.try( function()
	{
		// Process the options passed in
		buildOpts = ProcessOptions( options );
		
		sketchName = path.basename( options.sketchDir );
		
		console.log( "Processed options" );
	})
	.then( function()
	{
		// Create temp build directory if it doesn't already exist
		return fs.mkdirsAsync( options.buildDir );	
	})
	.then( function()
	{
		installDir = path.join( options.installBaseDir, options.productID );
		
		return fs.mkdirsAsync( installDir );
	})
	.then( function()
	{
		console.log( "Made dirs" );
		
		stagedSketchDir = path.join( options.buildDir, sketchName );
		
		// Remove existing sketch folder if it exists
		return fs.removeAsync( stagedSketchDir )
				.then( function()
				{
					// Copy the sketch folder to the staging sketch dir
					return fs.copyAsync( options.sketchDir, stagedSketchDir );
				})
	})
	.then( function()
	{
		console.log( "Removed old sketch" );
		
		// Generate preproc header file
		var output = "#pragma once\n\n";
		
		for( i = 0; i < options.preproc.length; ++i )
		{
			output += "#define " + options.preproc[ i ].split( "=" ).toString().replace( ",", " " ) + "\n";
		}
		
		return fs.writeFileAsync( path.join( stagedSketchDir, "CompileOptions.h" ), output );
		
	})
	.then( function()
	{
		console.log( "Made compileoptions" );
		
		var pluginDirs = GetDirectories( "/opt/openrov/cockpit/src/plugins" );
	
		var pluginString = "#pragma once\n\n";
	
		return Promise.map( pluginDirs, function( pluginName )
		{
			var pluginDir = path.join( "/opt/openrov/cockpit/src/plugins", pluginName );
			
			// Check for a firmware folder
			return fs.statAsync( path.join( pluginDir, "firmware" ) )
			.then( function()
			{
				// Copy firmware folder to PluginName dir in staged folder
				return fs.copyAsync( path.join( pluginDir, "firmware" ), path.join( stagedSketchDir, pluginName ) );
			})
			.then( function()
			{
				// Add include for plugin to Plugins.h 
				pluginString += "#include \"" + pluginName + "\\Instance.h\"\n";
			})
			.catch( function( err )
			{
				// Do nothing, we expect this to fail for all plugins that don't have firmware folders
			})
		} )
		.then( function()
		{
			return fs.writeFileAsync( path.join( stagedSketchDir, "Plugins.h" ), pluginString );
		} );
	})
	.then( function()
	{
		console.log( "Made plugins.h" );
		
		// Create promise
		var promise 		= spawnAsync( 'arduino-builder', buildOpts );
		var childProcess 	= promise.childProcess;

		// Attach listeners
		childProcess.stdout.on( 'data', onStdout );
		childProcess.stderr.on( 'data', onStderr );

		return promise;
	})
	.then( function()
	{		
		// Copy bin into install dir
		return fs.copyAsync( path.join( options.buildDir, sketchName + ".ino.bin" ), path.join( installDir, sketchName + ".bin" ) );
	})
	.then( function()
	{		
		// Copy elf into install dir
		return fs.copyAsync( path.join( options.buildDir, sketchName + ".ino.elf" ), path.join( installDir, sketchName + ".elf" ) );
	})
	.then( function()
	{
		console.log( "SUCCESS" );
		if( options.cleanAfterBuild )
		{
			// Clean up temp dir
			return fs.removeAsync( options.buildDir );
		}
	})
	.catch( function( err )
	{
		if( options.cleanAfterBuild )
		{
			// Clean up temp dir first
			return fs.removeAsync( options.buildDir )
					.then( function()
					{
						// Rethrow error
						throw err;
					});
		}
		else
		{
			throw err;
		}
	})

	
};

function ProcessOptions( options )
{
	// First, validate required options
	ValidateOptions( options );

	var defaults = 
	{
		sketchDir: 			"",
		productID:			"",
		buildDir:			"/opt/openrov/firmware/build",
		installBaseDir:		"/opt/openrov/firmware/bin",
		cleanAfterBuild: 	true,
		fqbn:				"",
		hardware: 			"/opt/openrov/arduino/hardware",
		tools: 				"/opt/openrov/arduino/hardware/tools",
		warnings: 			"all",
		verbose:			true,
		quiet: 				false,
		debug: 				5,
		libs:				[],
		preproc:			[]
	};

	// Override defaults with options
    options = options || {};
    for( var opt in defaults )
	{
		if( defaults.hasOwnProperty( opt ) && !options.hasOwnProperty( opt ) )
		{
			options[ opt ] = defaults[ opt ];
		}
	}
	
	// Create optArray
	var optArray = [];
	
	if( options.verbose ){ optArray.push( "-verbose" ); }
	if( options.quiet ){ optArray.push( "-quiet" ); }
	
	optArray.push( "-compile" );
	optArray.push( "-warnings", options.warnings );
	optArray.push( "-build-path", options.buildDir );
	
	optArray.push( "-hardware", options.hardware );
	optArray.push( "-tools", options.tools );
	
	for( i =0; i < options.libs.length; ++i )
	{
		optArray.push( "-libraries", options.libs[ i ] );
	};
	
	optArray.push( "-fqbn", options.fqbn );
	optArray.push( options.sketchDir );
	
	return optArray;
};

function ValidateOptions( options )
{	
	// Required parameters
	if( IsBlank( options.sketchDir ) )
	{
		throw new Error( "Missing required option: sketchDir" );
	}
	
	if( IsBlank( options.productID ) )
	{
		throw new Error( "Missing required option: productID" );
	}
	
	if( IsBlank( options.installBaseDir ) )
	{
		throw new Error( "Missing required option: installBaseDir" );
	}
	
	if( IsBlank( options.fqbn ) )
	{
		throw new Error( "Missing required option: fqbn" );
	}
};

function IsBlank( str ) 
{
    return ( !str || /^\s*$/.test(str) );
};

function GetDirectories( dir ) 
{
  return fs.readdirSync(dir).filter( function( file ) 
  {
    return fs.statSync( path.join( dir, file ) ).isDirectory();
  });
}

module.exports = new ArduinoBuilder();