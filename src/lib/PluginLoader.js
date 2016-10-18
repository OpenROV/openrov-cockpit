var path = require('path');
var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs-extra'));

// Checking existence
//return fs.statAsync( path.join( pluginDir, "firmware" ) )
var PluginLoader = function () {
  var self = this;
  function getFilter(ext) {
    return function (filename) {
      return filename.match(new RegExp('\\.' + ext + '$', 'i'));
    };
  }
  self.loadPlugins = function (dir, shareDir, required, deps, filter) {
    var result = {
        assets: [],
        scripts: [],
        styles: [],
        plugins: [],
        applets: [],
        webcomponents: []
      };
    // Get the directory contents
    return fs.readdirAsync(dir).filter(function (file) {
      // Apply an optional filter function if it exists
      if (filter !== undefined && filter(file) === false) {
        return false;
      }
      // Check to see if the file is a directory
      return fs.statAsync(path.join(dir, file)).then(function (stat) {
        return stat.isDirectory();
      }).catch(function (err) {
        return false;
      });
    }).each(function (plugin) {
      console.log('Loading ' + plugin + ' plugin.');
      var pluginInstance = null;
      return Promise.try(function () {
        var result;
        try{
          result= require(path.join(dir, plugin))(plugin, deps)
        }
        catch(ex){
          console.log(JSON.stringify({message:ex.message,stack:ex.stack}));
          throw ex;
        };
        return result;
      }).then(function (inst) {
        pluginInstance = inst;
        // Check to see if plugin's index.js was loaded
        if (pluginInstance == undefined) {
          throw new Error('Plugin:' + plugin + ' is invalid, does not return a plugin object');
        }
        // Push plugin into results
        if (pluginInstance !== undefined) {
          pluginInstance._raw = {
            rootpath: path.join(dir, plugin),
            applets: [],
            styles: [],
            scripts: [],
            assets: [],
            webcomponents: []
          };
          result.plugins.push(pluginInstance);
        }
        // Load applets for plugin
        var appletPromise = fs.readdirAsync(path.join(dir, plugin)).filter(getFilter('ejs')).each(function (ejs) {
            result.applets.push(dir + '/' + plugin + '/' + ejs);
            var ejsicon = path.join(dir, plugin, ejs + '.icon');
            // Handle ejs files, with and without icons
            return fs.statAsync(ejsicon).then(function () {
              // Push applet with ejs and icon
              pluginInstance._raw.applets.push({
                path: dir + '/' + plugin + '/' + ejs,
                icon: ejsicon
              });
            }).catch(function (err) {
              // Icon file didn't exist, just push ejs
              pluginInstance._raw.applets.push({ path: dir + '/' + plugin + '/' + ejs });
            });
          }).catch(function (err) {
          });
        // Check for public assets
        var publicAssets = path.join(dir, plugin, 'public');
        var publicPromise = fs.statAsync(publicAssets).then(function () {
            // Add public assets to a static route
            result.assets.push({
              path: shareDir + '/' + plugin,
              assets: publicAssets
            });
            pluginInstance._raw.assets.push({
              path: shareDir + '/' + plugin,
              assets: publicAssets
            });
          }).catch(function (err) {
          });
        // Check for JS assets
        var js = path.join(publicAssets, 'js');
        var jsPromise = fs.statAsync(js).then(function () {
            return fs.readdirAsync(js).filter(getFilter('js')).each(function (script) {
              // Add js assets
              result.scripts.push(shareDir + '/' + plugin + '/js/' + script);
              pluginInstance._raw.scripts.push(shareDir + '/' + plugin + '/js/' + script);
            });
          }).catch(function (err) {
          });
        // Check for CSS assets
        var css = path.join(publicAssets, 'css');
        var cssPromise = fs.statAsync(css).then(function () {
            return fs.readdirAsync(css).filter(getFilter('css')).each(function (style) {
              // Add css assets
              result.styles.push(shareDir + '/' + plugin + '/css/' + style);
              pluginInstance._raw.styles.push(shareDir + '/' + plugin + '/css/' + style);
            });
          }).catch(function (err) {
          });
        // Add webcomponent assets to a static route
        var wcAssets = path.join(dir, plugin, 'public/webcomponents');
        var wcPromise = fs.statAsync(wcAssets).then(function () {
            result.assets.push({
              path: 'components' + '/' + plugin,
              assets: wcAssets
            });
            pluginInstance._raw.assets.push({
              path: 'components' + '/' + plugin,
              assets: wcAssets
            });
            return fs.readdirAsync(wcAssets).filter(getFilter('html')).each(function (wc) {
              // Add wc assets
              // TODO: Make clear documentation that the filename must = the component name as a convention OR 
              // update this code to parse the wc file and pull out the is: property
              result.webcomponents.push({path:path.join('components/',plugin,wc)});
            });             
          }).catch(function (err) {
          });
        // Add bower assets to a static route
        var bowerAssets = path.join(dir, plugin, 'public/bower_components');
        var bowerPromise = fs.statAsync(bowerAssets).then(function () {
            result.assets.push({
              path: 'components',
              assets: bowerAssets
            });
            pluginInstance._raw.assets.push({
              path: 'components',
              assets: bowerAssets
            });
          }).catch(function (err) {
          });
        return Promise.all([
          appletPromise,
          publicPromise,
          jsPromise,
          cssPromise,
          wcPromise,
          bowerPromise
        ]);
      }).catch(function (err) {
        // If plugin belongs to a required subsection, rethrow error
        if (required) {
          throw err;
        } else {
          console.log('Error loading plugin: ' + err.message);
        }
      });
    }).catch(function (err) {
      // If a required subsection, rethrow error
      if (required) {
        throw err;
//        throw new Error('Error loading critical plugin section: ' + JSON.stringify(err));
      } else {
        console.log('Error loading non-critical plugin section: ' + err.message);
      }
    }).then(function () {
      // Return the results
      return result;
    });
  };
  return self;
};
module.exports = PluginLoader;