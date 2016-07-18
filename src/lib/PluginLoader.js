var path 			= require( "path" );
var Promise		= require( "bluebird" );
var fs				= Promise.promisifyAll( require( "fs-extra" ) );

// Checking existence
//return fs.statAsync( path.join( pluginDir, "firmware" ) )

var PluginLoader = function() 
{
  var self = this;

  function getFilter(ext) 
  {
    return function( filename ) 
    {
      return filename.match( new RegExp( '\\.' + ext + '$', 'i' ) );
    };
  }

  self.loadPlugins = function(dir, shareDir, required, deps, filter) 
  {
    var result = 
    {
      assets: [],
      scripts: [],
      styles: [],
      plugins: [],
      applets: []
    };

    // Get the directory contents
    return fs.readdirAsync( dir )
    .filter( function( file )
    {
        // Apply an optional filter function if it exists
        if( ( filter !== undefined ) && filter( file ) === false )
        {
          return false;
        }

        // Check to see if the file is a directory
        return fs.statAsync( path.join( dir, file ) )
                .then( function( stat ) 
                {
                    return stat.isDirectory();
                })
                .catch( function( err ) 
                {
                    return false;
                });
    } )
    .each( function( plugin ) 
    {
      console.log( 'Loading ' + plugin + ' plugin.' );

      return Promise.try( function()
      {
        var pluginInstance = require( path.join( dir, plugin) )( plugin, deps );

        // Check to see if plugin's index.js was loaded
        if( pluginInstance == undefined )
        {
          throw new Error( 'Plugin:' + plugin + ' is invalid, does not return a plugin object' );
        }

        // Push plugin into results
        if( pluginInstance !== undefined )
        {
          pluginInstance._raw = 
          {
            rootpath:path.join( dir, plugin ),
            applets: [],
            styles: [],
            scripts: [],
            assets: []
          };

          result.plugins.push( pluginInstance );
        }

        // Load applets for plugin
        var appletPromise = fs.readdirAsync( path.join( dir, plugin ) )
                              .filter( getFilter( 'ejs' ) )
                              .each( function( ejs ) 
                              {
                                result.applets.push( dir + '/' + plugin + '/' + ejs );

                                var ejsicon = path.join( dir, plugin, ejs + '.icon' );

                                console.log( "added applet for " + plugin );

                                // Handle ejs files, with and without icons
                                return fs.statAsync( ejsicon )
                                        .then( function()
                                        {
                                          // Push applet with ejs and icon
                                          pluginInstance._raw.applets.push( { path: dir + '/' + plugin + '/' + ejs, icon: ejsicon } );
                                        })
                                        .catch( function( err )
                                        {
                                          // Icon file didn't exist, just push ejs
                                          pluginInstance._raw.applets.push( { path: dir + '/' + plugin + '/' + ejs } );
                                        });
                              } )
                              .catch( function( err )
                              {
                                // No applets found, no problem
                              } );

        

        // Check for public assets
        var publicAssets = path.join(dir, plugin, 'public');
        var publicPromise = fs.statAsync( publicAssets )
                            .then( function()
                            {
                              // Add public assets to a static route
                              console.log( "added public for " + plugin );
                              result.assets.push({ path: shareDir + '/' + plugin, assets: publicAssets});
                              pluginInstance._raw.assets.push({ path: shareDir + '/' + plugin, assets: publicAssets});
                            })
                            .catch( function( err )
                            {
                              // No public assets, no problem
                            } );

        // Check for JS assets
        var js = path.join( publicAssets, 'js' );
        var jsPromise = fs.statAsync( js )
                        .then( function()
                        {
                          return fs.readdirAsync( js )
                                  .filter( getFilter('js') )
                                  .each( function( script )
                                  {
                                    // Add js assets
                                    console.log( "added js for " + plugin + ": script: " + script );
                                    result.scripts.push( shareDir + '/' + plugin + '/js/' + script );
                                    pluginInstance._raw.scripts.push( shareDir + '/' + plugin + '/js/' + script );
                                  } );
                        })
                        .catch( function( err )
                        {
                          // No js assets, no problem
                        } );

        // Check for CSS assets
        var css = path.join( publicAssets, 'css' );
        var cssPromise = fs.statAsync( css )
                        .then( function()
                        {
                          return fs.readdirAsync( css )
                                  .filter( getFilter('css') )
                                  .each( function( style )
                                  {
                                    // Add css assets
                                    console.log( "added css for " + plugin + ": script: " + style );
                                    result.styles.push(shareDir + '/' + plugin + '/css/' + style);
                                    pluginInstance._raw.styles.push(shareDir + '/' + plugin + '/css/' + style);
                                  } );
                        })
                        .catch( function( err )
                        {
                          // No css assets, no problem
                        } );

        // Add webcomponent assets to a static route
        var wcAssets = path.join(dir, plugin, 'public/webcomponents');
        var wcPromise = fs.statAsync( wcAssets )
                    .then( function()
                    {
                      console.log( "added wc for " + plugin );
                      result.assets.push({ path: 'components' + '/' + plugin, assets: wcAssets});
                      pluginInstance._raw.assets.push({ path: 'components' + '/' + plugin, assets: wcAssets});
                    })
                    .catch( function( err )
                    {
                      // No wc assets, no problem
                    } );

        // Add bower assets to a static route
        var bowerAssets = path.join(dir, plugin, 'public/bower_components');
        var bowerPromise = fs.statAsync( bowerAssets )
                  .then( function()
                  {
                    console.log( "added bower for " + plugin );
                    result.assets.push({ path: 'components' , assets: bowerAssets});
                    pluginInstance._raw.assets.push({ path: 'components' , assets: bowerAssets});
                  })
                  .catch( function( err )
                  {
                    // No bower assets, no problem
                  } );
        
        return Promise.all( 
                [ 
                  appletPromise,
                  publicPromise,
                  jsPromise,
                  cssPromise,
                  wcPromise,
                  bowerPromise
                ] );
      } )
      .catch( function( err )
      {
        // If plugin belongs to a required subsection, rethrow error
        if( required )
        {
          throw err;
        }
        else
        {
          console.log( "Error loading plugin: " + err.message );
        }
      });
    })
    .catch( function( err )
    {
      // If a required subsection, rethrow error
      if( required )
      {
        throw new Error( "Error loading critical plugin section: " + err.message )
      }
      else
      {
        console.log( "Error loading non-critical plugin section: " + err.message );
      }
    })
    .then( function()
    {
      // Return the results
      return result;
    } );
  };

  return self;
};
module.exports = PluginLoader;
