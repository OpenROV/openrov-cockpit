#!/usr/bin/env node

var path 			= require( "path" );
var Promise			= require( "bluebird" );
var fs				= Promise.promisifyAll( require( "fs-extra" ) );

var Installer = function(){};

Installer.prototype.Install = function( installDir )
{
	console.log( "Installing..." );
	
	return fs.readFileAsync( path.resolve( installDir, "./manifest.json" ) )
			.then( JSON.parse )
			.then( function( files )
			{
				return Promise.map( Object.keys( files ), function( file )
				{
					// Copy the file to it's destination
					console.log( "Installing: " + path.join( installDir, file ) + " to: " + path.join( files[ file ], file ) );
					return fs.copyAsync( path.join( installDir, file ), path.join( files[ file ], path.basename( file ) ) );
				})
			})
			.then( function( result )
			{
				console.log( "Install complete: " + result );
			});
};

Installer.prototype.Uninstall = function( installDir ) 
{
	console.log( "Uninstalling..." );

	return fs.readFileAsync( path.resolve( installDir, "./manifest.json" ) )
			.then( function( data )
			{
				return JSON.parse( data );
			} )
			.then( function( files )
			{
				return Promise.map( Object.keys( files ), function( file )
				{
					// Delete the file
					console.log( "Deleting: " + path.join( files[ file ], path.basename( file ) ) );
					return fs.removeAsync( path.join( files[ file ], path.basename( file ) ) )
							.catch( function( err )
							{
								// Do nothing, file was already missing.
							} );
				})
			})
			.then( function()
			{
				console.log( "Uninstall complete!" );
			});
};

module.exports = new Installer();