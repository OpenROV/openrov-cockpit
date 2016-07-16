var fs = require('fs');
var path = require('path');

var Promise = require( "bluebird" );
var Q =require('q');

if (typeof path.existsSync === 'undefined'){
  //forward compatibiltiy to node 12+ from 10. Remove
  //once the beaglebone node is moved to v12
  //by changing the path to fs where existsSync
  //is used
  path.existsSync = fs.existsSync;
}

var PluginLoader = function() {
  var self = this;

  function getFilter(ext) {
    return function (filename) {
      return filename.match(new RegExp('\\.' + ext + '$', 'i'));
    };
  }

  self.loadPlugins = function(dir, shareDir, deps, filter) {
    return Q.Promise(function(resolve,reject,notify){

      var result = {
        assets: [],
        scripts: [],
        styles: [],
        plugins: [],
        applets: []
      };
      fs.readdir(dir, function (err, files) {
        if (err) {
          reject(err);
        }
        files.filter(function (file) {
          if ((filter !== undefined) && filter(file)===false){
            return false;
          }
          return fs.statSync(path.join(dir, file)).isDirectory();
        }).forEach(function (plugin) {
          console.log('Loading ' + plugin + ' plugin.');
          // Load the backend code
          if (path.existsSync(path.join(dir, plugin))) {
            var pluginInstance = require(path.join(dir, plugin))(plugin, deps);
            if (pluginInstance == undefined){
              console.error('Plugin:' + plugin + ' is invalid, does not return a plugin object');
              return;
            }
            if (pluginInstance !== undefined){
              pluginInstance._raw = {rootpath:path.join(dir, plugin), applets: [], styles: [], scripts: [], assets: []};
              result.plugins.push(pluginInstance);
            }

            fs.readdirSync(path.join(dir, plugin)).filter(getFilter('ejs')).forEach(function (ejs) {
              result.applets.push(dir + '/' + plugin + '/' + ejs);
              if (fs.existsSync(ejsicon = path.join(dir, plugin, ejs + '.icon'))) {
                pluginInstance._raw.applets.push({path: dir + '/' + plugin + '/' + ejs, icon:ejsicon});
              } else {
                pluginInstance._raw.applets.push({path: dir + '/' + plugin + '/' + ejs});
              }

            });

            //Note the asset is set in the if check and used by the css and js search
            // Add the public assets to a static route
            if (fs.existsSync(assets = path.join(dir, plugin, 'public'))) {
              result.assets.push({ path: shareDir + '/' + plugin, assets: assets});
              pluginInstance._raw.assets.push({ path: shareDir + '/' + plugin, assets: assets});
            }

            // Add the js to the view
            if (fs.existsSync(js = path.join(assets, 'js'))) {
              fs.readdirSync(js).filter(getFilter('js')).forEach(function (script) {
                result.scripts.push(shareDir + '/' + plugin + '/js/' + script);
                pluginInstance._raw.scripts.push(shareDir + '/' + plugin + '/js/' + script);
              });
            }
            // Add the css to the view
            if (fs.existsSync(css = path.join(assets, 'css'))) {
              fs.readdirSync(css).filter(getFilter('css')).forEach(function (style) {
                result.styles.push(shareDir + '/' + plugin + '/css/' + style);
                pluginInstance._raw.styles.push(shareDir + '/' + plugin + '/css/' + style);
              });
            }

            // Add the webcomponents and bower dirs assets to a static route
            if (fs.existsSync(assets = path.join(dir, plugin, 'public/webcomponents'))) {
              result.assets.push({ path: 'components' + '/' + plugin, assets: assets});
              pluginInstance._raw.assets.push({ path: 'components' + '/' + plugin, assets: assets});
            }
            if (fs.existsSync(assets = path.join(dir, plugin, 'public/bower_components'))) {
              result.assets.push({ path: 'components' , assets: assets});
              pluginInstance._raw.assets.push({ path: 'components' , assets: assets});
            }

         } else {
          console.log('Skipping as file not found in expected location');
         }

        });
        resolve(result);
      });
    });
  };

  return self;
};
module.exports = PluginLoader;
