var path 			= require( "path" );
var Promise			= require( "bluebird" );
var fs				= Promise.promisifyAll( require( "fs-extra" ) );
var execAsync		= require('child-process-promise').exec;

var Installer = function(){};

Installer.prototype.Install = function( installDir )
{
	console.log( "Installing..." );
	
	return fs.readFileAsync( path.resolve( installDir, "./manifest.json" ) )
			.then( JSON.parse )
			.then( function( manifest )
			{
				return Promise.map( manifest.preinstall, function( script )
				{
					// Run pre-install scripts
					console.log( "Executing pre-install script: " + script.name );
					return ExecuteScript( installDir, script );
				})
				.then( function()
				{
					return Promise.map( manifest.files, function( file )
					{						
						// Copy the file to it's destination
						console.log( "Installing: " + file.src + " to: " + file.dest );
						return InstallFile( installDir, file );
					})
				} )
				.then( function()
				{
					return Promise.map( manifest.postinstall, function( script )
					{
						// Run post-install scripts
						console.log( "Executing post-install script: " + script.name );
						return ExecuteScript( installDir, script );
					})
				} );
			})
			.then( function()
			{
				console.log( "Install complete." );
			});
};

Installer.prototype.Uninstall = function( installDir ) 
{
	console.log( "Uninstalling..." );

	return fs.readFileAsync( path.resolve( installDir, "./manifest.json" ) )
			.then( JSON.parse )
			.then( function( manifest )
			{
				return Promise.map( manifest.preuninstall, function( script )
				{
					// Run pre-uninstall scripts
					console.log( "Executing pre-uninstall script: " + script.name );
					return ExecuteScript( installDir, script );
				})
				.then( function()
				{
					return Promise.map( manifest.files, function( file )
					{						
						// Removed specified file
						console.log( "Uninstalling file: " + file.dest );
						return UninstallFile( file );
					})
					.catch( function( err )
					{
						// Do nothing, file was already gone
					});
				} )
				.then( function()
				{
					return Promise.map( manifest.postuninstall, function( script )
					{
						// Run post-uninstall scripts
						console.log( "Executing post-uninstall script: " + script.name );
						return ExecuteScript( installDir, script );
					})
				} );
			})
			.then( function()
			{
				console.log( "Uninstall complete." );
			});
};

function InstallFile( baseDir, file )
{
	var src = path.resolve( path.join( baseDir, "files", file.src ) );
	
	return fs.copyAsync( src, path.join( file.dest, path.basename( file.src ) ) );
}

function UninstallFile( file )
{
	return fs.removeAsync( path.join( file.dest, path.basename( file.src ) ) );
}

function ExecuteScript( baseDir, script )
{
	return Promise.try( function()
	{
		var src = path.resolve( path.join( baseDir, "scripts", script.name ) );
		
		var opts =
		{
			cwd: path.resolve( baseDir )
		}
		
		switch( script.type )
		{
			case "bash":
			{
				// Execute bash script
				return execAsync( "bash " + src, opts )
						.then( function( result )
						{
							console.log( 'stdout: ', result.stdout );
							console.log( 'stderr: ', result.stderr );
						});
			}
			
			case "node":
			{
				// Execute node script
				return execAsync( "node " + src, opts )
						.then( function( result )
						{
							console.log( 'stdout: ', result.stdout );
							console.log( 'stderr: ', result.stderr );
						});
			}

			case "python":
			{
				// Execute python script
				return execAsync( "python " + src, opts )
						.then( function( result )
						{
							console.log( 'stdout: ', result.stdout );
							console.log( 'stderr: ', result.stderr );
						});
			}
			
			default:
			{
				throw new Error( "Unknown script type." );
			}
		}
	} );
}

module.exports = new Installer();