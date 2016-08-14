var bower = require('bower');
var PREFERENCES = 'plugins:plugin-finder';
function pluginFinder(name, deps) {
  console.log('Pugin Finder plugin loaded.');
  //instance variables
  this.cockpit = deps.cockpit;
  this.global = deps.globalEventLoop;
  this.deps = deps;
}
pluginFinder.prototype.start = function start() {
  var self = this;
  var deps = this.deps;
  self.global.withHistory.on('settings-change.pluginFinder', function (data) {
    deps.cockpit.on('plugin.pluginFinder.search', function (name, callback) {
      console.log('performing search for plugins.');
      console.dir(callback);
      bower.commands.list({}, { cwd: '/usr/share/cockpit' }).on('end', function (listing) {
        var list = listing.dependencies;
        bower.commands.search('openrov-plugin-' + name, {}).on('end', function (results) {
          for (var result in results) {
            //console.log(list.keys());
            if (results[result].name in list) {
              results[result].InstalledOnROV = true;
            }
          }
          console.log('sending plugins list to browser');
          deps.cockpit.emit('plugin.pluginFinder.searchResults', results);
          if (typeof callback == 'function') {
            callback(results);
          }
        });
      });
    });
    deps.cockpit.on('plugin.pluginFinder.info', function (name, callback) {
      if (typeof callback !== 'function') {
        return;
      }
      console.log('performing list for plugins');
      bower.commands.info('openrov-plugin-' + name).on('end', function (result) {
        callback(result);
      });
    });
    deps.cockpit.on('plugin.pluginFinder.list', function (name, callback) {
      console.log('performing list for plugins');
      bower.commands.list({}, { cwd: '/usr/share/cockpit' }).on('end', function (results) {
        console.log('sending plugins list to browser');
        deps.cockpit.emit('plugin.pluginFinder.installed', results);
        if (typeof callback == 'function') {
          callback(results);
        }
      });
    });
    deps.cockpit.on('plugin.pluginFinder.install', function (name, callback) {
      bower.commands.install([name], { save: false }, {
        cwd: '/usr/share/cockpit',
        force: true
      }).on('error', function (err) {
        console.log(err);
        deps.cockpit.emit('plugin.pluginFinder.installStatus', err);
        if (typeof callback == 'function') {
          callback(err);
        }
      }).on('log', function (info) {
        console.log(info);
        deps.cockpit.emit('plugin.pluginFinder.installStatus', info);
      }).on('end', function (installed) {
        console.log('done processing plugin install');
        deps.cockpit.emit('plugin.pluginFinder.installResults', installed);
        deps.cockpit.emit('plugin.pluginFinder.restartRequired');
        if (typeof callback == 'function') {
          callback(installed);
        }
        //There is a bug with bower, possibly around re-installing
        //that causes the CPU to max out forever. This restart
        //is as much a work-around as it is needed to load the
        //server-side aspects of the plugin.
        console.log('intentional restart');
        setTimeout(process.exit(17), 5000);
      });
    });
    deps.cockpit.on('plugin.pluginFinder.uninstall', function (name, callback) {
      bower.commands.uninstall([name], {}, { cwd: '/usr/share/cockpit' }).on('error', function (err) {
        console.log(err);
      }).on('log', function (info) {
        console.log(info);
        deps.cockpit.emit('plugin.pluginFinder.uninstallStatus', info);
      }).on('end', function (uninstalled) {
        console.log('done processing plugin uninstall');
        deps.cockpit.emit('plugin.pluginFinder.uninstallResults', uninstalled);
        deps.cockpit.emit('plugin.pluginFinder.restartRequired');
        if (typeof callback == 'function') {
          callback(uninstalled);
        }
        //There is a bug with bower, possibly around re-installing
        //that causes the CPU to max out forever. This restart
        //is as much a work-around as it is needed to load the
        //server-side aspects of the plugin.
        console.log('intentional restart');
        setTimeout(process.exit(17), 5000);
      });
    });
  });
};
pluginFinder.prototype.getSettingSchema = function getSettingSchema() {
  return [{
      'title': 'Plugin Finder Settings',
      'id': 'pluginFinder',
      'type': 'object',
      'properties': {}
    }];
};
module.exports = function (name, deps) {
  return new pluginFinder(name, deps);
};