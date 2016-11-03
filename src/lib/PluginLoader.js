var path = require('path');
var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs-extra'));


/* Closure private functions for script */
function getFilter(ext) {
    return function(filename) {
        return filename.match(new RegExp('\\.' + ext + '$', 'i'));
    };
}


class PluginLoader
{
    constructor(dir, shareDir, deps, options)
    {
      console.dir(deps);

     // State variables updated by the resource finding functions
      var result = {
          assets: [],
          scripts: [],
          styles: [],
          plugins: [],
          applets: [],
          webcomponents: []
      };
      var rawdata = {};
      var publicAssets;
      var filter = options.filter;
      var required = options.required;
      var cacheFile = options.cacheFile;
      var pluginName;

      //These functions are intended to be bound to the overall state of the loadPlugins method

      var instantiatePlugins = function instantiatePlugins(plugins){
        return plugins.map(function(plugin){
                console.log('Loading ' + plugin + ' plugin.');
                return Promise.try(function() {
                    var pluginInstance;

                    try {
                        pluginInstance = require(path.join(dir, plugin))(plugin, deps)
                        pluginInstance.name=plugin;
                        pluginInstance._raw=rawdata[plugin];
                        result.plugins.push(pluginInstance); 
                    } catch (ex) {
                        console.log(JSON.stringify({
                            message: ex.message,
                            stack: ex.stack
                        }));
                        throw ex;
                    };
                    // Check to see if plugin's index.js was loaded
                    if (pluginInstance == undefined) {
                        throw new Error('Plugin:' + plugin + ' is invalid, does not return a plugin object');
                    }
                    return pluginInstance; //insantiated plugin 
                });

        });
      }

      var derivePluginNamesfromCrawlingFoldersAsync = function derivePluginNamesfromCrawlingFoldersAsync() {
          return fs.readdirAsync(dir)
              .filter(function(file) {
                  // Apply an optional filter function if it exists
                  if (filter !== undefined && filter(file) === false) {
                      return false;
                  }
                  return true;
              })
              .then(function(dirs){
                return dirs;
              })
              .filter(function(file){
                  // Check to see if the file is a directory
                  return fs.statAsync(path.join(dir, file))
                      .then(function(stat) {
                          return stat.isDirectory();
                      })
                      .catch(function(err) {
                          return false;
                      });
              })
              .then(function(dirs){
                return dirs;
              })
      }

      var findAppletsAsync = function findAppletsAsync(){ 
          return fs.readdirAsync(path.join(dir, pluginName))
          .filter(getFilter('ejs'))
          .each(function(ejs) {
              result.applets.push(dir + '/' + pluginName + '/' + ejs);
              var ejsicon = path.join(dir, pluginName, ejs + '.icon');
              // Handle ejs files, with and without icons
              return fs.statAsync(ejsicon)
                  .then(function() {
                      // Push applet with ejs and icon
                      rawdata[pluginName].applets.push({
                          path: dir + '/' + pluginName + '/' + ejs,
                          icon: ejsicon
                      });
                  })
                  .catch(function(err) {
                      // Icon file didn't exist, just push ejs
                      rawdata[pluginName].applets.push({
                          path: dir + '/' + pluginName + '/' + ejs
                      });
                  });
          })
          .catch(function(err) {});
      }

      var findPublicWebFoldersAsync = function findPublicWebFoldersAsync(){
        publicAssets = path.join(dir, pluginName, 'public');  
          return fs.statAsync(publicAssets)
              .then(function() {
                  // Add public assets to a static route
                  result.assets.push({
                      path: shareDir + '/' + pluginName,
                      assets: publicAssets
                  });
                  rawdata[pluginName].assets.push({
                      path: shareDir + '/' + pluginName,
                      assets: publicAssets
                  });
              })
              .catch(function(err) {});  
      }

      var findPublicJSResourcesAsync = function findPublicJSResourcesAsync(){
        var js = path.join(publicAssets, 'js');
        return fs.statAsync(js)
            .then(function() {
                return fs.readdirAsync(js)
                    .filter(getFilter('js'))
                    .each(function(script) {
                        // Add js assets
                        result.scripts.push(shareDir + '/' + pluginName + '/js/' + script);
                        rawdata[pluginName].scripts.push(shareDir + '/' + pluginName + '/js/' + script);
                    });
            })
            .catch(function(err) {});  
      }

      var findPublicCSSResoucesAsync = function findPublicCSSResoucesAsync(){
        var css = path.join(publicAssets, 'css');
        return fs.statAsync(css)
            .then(function() {
                return fs.readdirAsync(css)
                    .filter(getFilter('css'))
                    .each(function(style) {
                        // Add css assets
                        result.styles.push(shareDir + '/' + pluginName + '/css/' + style);
                        rawdata[pluginName].styles.push(shareDir + '/' + pluginName + '/css/' + style);
                    });
            })
            .catch(function(err) {});  
      }

      var findWebcomponentResourcesAsync = function findWebcomponentResourcesAsync(){
          var wcAssets = path.join(dir, pluginName, 'public/webcomponents');
          return fs.statAsync(wcAssets)
              .then(function() {
                  result.assets.push({
                      path: 'components' + '/' + pluginName,
                      assets: wcAssets
                  });
                  rawdata[pluginName].assets.push({
                      path: 'components' + '/' + pluginName,
                      assets: wcAssets
                  });
                  return fs.readdirAsync(wcAssets)
                      .filter(getFilter('html'))
                      .each(function(wc) {
                          // Add wc assets
                          // TODO: Make clear documentation that the filename must = the component name as a convention OR 
                          // update this code to parse the wc file and pull out the is: property
                          result.webcomponents.push({
                              path: path.join('components/', pluginName, wc)
                          });
                      });
              })
              .catch(function(err) {});  
      }

      var findBowerResourcesAsync = function findBowerResourcesAsync(){
          var bowerAssets = path.join(dir, pluginName, 'public/bower_components');
          return fs.statAsync(bowerAssets)
              .then(function() {
                  result.assets.push({
                      path: 'components',
                      assets: bowerAssets
                  });
                  rawdata[pluginName].assets.push({
                      path: 'components',
                      assets: bowerAssets
                  });
              })
              .catch(function(err) {});  
      }

   /**
    *  Return an array of resources in each plugin folder
    */
   this.crawlPluginFolders= function crawlPluginFolders() {
    

     // State variables updated by the resource finding functions
      result = {
          assets: [],
          scripts: [],
          styles: [],
          plugins: [],
          applets: [],
          webcomponents: []
      };
      rawdata = {};
      publicAssets = "";

     return derivePluginNamesfromCrawlingFoldersAsync()
     .then(function(r){
       console.dir(r);
       return r;
     })
      .each(function(_pluginName){
        pluginName = _pluginName
        //given the  plugin, find all related assets and update function shared state variables 
        //by binding to this, we should have access to the function scrope 
        rawdata[pluginName]={
          assets: [],
          scripts: [],
          styles: [],
          plugins: [],
          applets: [],
          webcomponents: []
        }
        return  Promise.all( 
        [
          findAppletsAsync(),
          findPublicWebFoldersAsync(),
          findPublicJSResourcesAsync(),
          findPublicCSSResoucesAsync(),
          findWebcomponentResourcesAsync(),
          findBowerResourcesAsync()
        ]
      )
      })

   }      

   this.loadPluginsAsync = function(){
    var self=this;
    return Promise.try(function(){
        var cache = {};
        try{
            //TODO: When in production, make sure that updates to the environme
            if (process.env.IGNORE_CACHE == "true") { 
                throw new Error("Only load cache in production")
            }           
            cache = require(cacheFile);
            result = cache.result;
            rawdata = cache.rawdata;
            return cache.plugins;
        }catch(e){
            //regenerate the cache if missing
            return self.crawlPluginFolders()
            .then(function(plugins){
                cache.result = result;
                cache.plugins = plugins;
                cache.rawdata = rawdata;
                fs.writeFile(cacheFile, JSON.stringify(cache), 'utf8');
                return plugins;
            })
        }

        
    })
    .then(function(plugins){
      return instantiatePlugins(plugins) //intentionally kick off without a callback
    })
    .then(function(){
      return result;
    })
   }
      
    }

   flushCache(){

   }

}
 


module.exports = function(dir, shareDir, deps, options) 
{
    return new PluginLoader(dir, shareDir, deps, options);
};