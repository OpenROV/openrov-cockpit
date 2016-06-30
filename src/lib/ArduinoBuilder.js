var path 			= require( "path" );
var Promise			= require( "bluebird" );
var fs				= Promise.promisifyAll( require( "fs-extra" ) );
var spawnAsync 		= require('child-process-promise').spawn;

var ArduinoBuilder 	= function()
{
};

var AllOptions = 
{

};

ArduinoBuilder.prototype.BuildSketch = function( options, onStdout, onStderr )
{
	var buildOpts 		= [];
	var sketchName		= "";
	var stagedSketchDir	= "";
	
	return Promise.try( function()
	{
		// Process the options passed in
		buildOpts = ProcessOptions( options );
		
		sketchName = path.basename( options.sketchPath );
	})
	.then( function()
	{
		// Create temp build directory if it doesn't already exist
		return fs.mkdirsAsync( options.buildDir );	
	})
	.then( function()
	{
		stagedSketchDir = path.join( options.buildDir, sketchName );
		
		// Remove existing sketch folder if it exists
		return fs.removeAsync( stagedSketchDir )
				.then( function()
				{
					// Copy the sketch folder to the staging sketch dir
					return fs.copyAsync( options.sketchPath, stagedSketchDir );
				})
	})
	.then( function()
	{
		// Generate preproc header file
		var output = "#pragma once\n\n";
		
		for( i = 0; i < options.preproc.length; ++i )
		{
			output += "#define " + options.preproc[ i ].split( "=" ).toString().replace( ",", " " ) + "\n";
		}
		
		return fs.writeFileAsync( path.join( stagedSketchDir, "compile_options.h" ), output );
		
	})
	.then( function()
	{
		// Find all plugins
		
		
		// Generate plugin include file
		// Copy plugin folders into temp directory
	})
	.then( function()
	{
		// Create promise
		var promise 		= spawn( 'arduino-builder', buildOpts );
		var childProcess 	= promise.childProcess;

		// Attach listeners
		childProcess.stdout.on( 'data', onStdout );
		childProcess.stderr.on( 'data', onStderr );

		return promise;
	})
	.then( function()
	{
		// Copy bin and elf into destination dir
	})
	.then( function()
	{
		if( options.cleanAfterBuild )
		{
			// Clean up temp dir
			return fs.removeAsync( self.buildDir );
		}
	})
	.catch( function( err )
	{
		if( options.cleanAfterBuild )
		{
			// Clean up temp dir first
			return fs.removeAsync( self.buildDir )
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

function ProcessOptions( opts )
{
	// First, validate required options
	ValidateOptions( options );

	var defaults = 
	{
		sketchPath: 		"",
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
	
	// Update installBaseDir
	options.installBaseDir = path.join( options.installBaseDir, options.productID );
	
	// Create optArray
	var optArray = [];
	
	if( options.verbose ){ optArray.push( "-verbose" ); }
	if( options.quiet ){ optArray.push( "-quiet" ); }
	
	optArray.push( "-compile" );
	optArray.push( "-warnings", options.warnings );
	optArray.push( "-build-path", options.buildDir );
	
	optArray.push( "-hardware", options.hardware );
	optArray.push( "-tools", options.tools );
	
	for( i =0; i < option.libs.length; ++i )
	{
		optArray.push( "-libraries", options.option.libs[ i ] );
	};
	
	optArray.push( "-fqbn", options.fqbn );
	optArray.push( options.sketchPath );
	
	return optArray;
};

function ValidateOptions( options )
{	
	// Required parameters
	if( IsBlank( options.sketchPath ) )
	{
		throw new Error( "Missing required option: sketchPath" );
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