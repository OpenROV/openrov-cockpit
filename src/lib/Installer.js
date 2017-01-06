var path = require('path');
var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs-extra'));
var execAsync = require('child-process-promise').exec;
var logger = require('AppFramework').logger;
var Installer = function () {
};
Installer.prototype.Install = function (installDir) {
  logger.info('Installing...');
  return fs.readFileAsync(path.resolve(installDir, './manifest.json')).then(JSON.parse).then(function (manifest) {
    return Promise.map(manifest.preinstall, function (script) {
      // Run pre-install scripts
      logger.info('Executing pre-install script: ' + script.name);
      return ExecuteScript(installDir, script);
    }).then(function () {
      return Promise.map(manifest.files, function (file) {
        // Copy the file to it's destination
        logger.info('Installing: ' + file.src + ' to: ' + file.dest);
        return InstallFile(installDir, file);
      });
    }).then(function () {
      return Promise.map(manifest.postinstall, function (script) {
        // Run post-install scripts
        logger.info('Executing post-install script: ' + script.name);
        return ExecuteScript(installDir, script);
      });
    });
  }).then(function () {
    logger.info('Install complete.');
  });
};
Installer.prototype.Uninstall = function (installDir) {
  logger.info('Uninstalling...');
  return fs.readFileAsync(path.resolve(installDir, './manifest.json')).then(JSON.parse).then(function (manifest) {
    return Promise.map(manifest.preuninstall, function (script) {
      // Run pre-uninstall scripts
      logger.info('Executing pre-uninstall script: ' + script.name);
      return ExecuteScript(installDir, script);
    }).then(function () {
      return Promise.map(manifest.files, function (file) {
        // Removed specified file
        logger.info('Uninstalling file: ' + file.dest);
        return UninstallFile(file);
      }).catch(function (err) {
      });
    }).then(function () {
      return Promise.map(manifest.postuninstall, function (script) {
        // Run post-uninstall scripts
        logger.info('Executing post-uninstall script: ' + script.name);
        return ExecuteScript(installDir, script);
      });
    });
  }).then(function () {
    logger.info('Uninstall complete.');
  });
};
function InstallFile(baseDir, file) {
  var src = path.resolve(path.join(baseDir, 'files', file.src));
  return fs.copyAsync(src, path.join(file.dest, path.basename(file.src)));
}
function UninstallFile(file) {
  return fs.removeAsync(path.join(file.dest, path.basename(file.src)));
}
function ExecuteScript(baseDir, script) {
  return Promise.try(function () {
    var src = path.resolve(path.join(baseDir, 'scripts', script.name));
    var opts = { cwd: path.resolve(baseDir) };
    switch (script.type) {
    case 'bash': {
        // Execute bash script
        return execAsync('bash ' + src, opts).then(function (result) {
          logger.info('stdout: ', result.stdout);
          logger.info('stderr: ', result.stderr);
        });
      }
    case 'node': {
        // Execute node script
        return execAsync('node ' + src, opts).then(function (result) {
          logger.info('stdout: ', result.stdout);
          logger.info('stderr: ', result.stderr);
        });
      }
    case 'python': {
        // Execute python script
        return execAsync('python ' + src, opts).then(function (result) {
          logger.info('stdout: ', result.stdout);
          logger.info('stderr: ', result.stderr);
        });
      }
    default: {
        throw new Error('Unknown script type.');
      }
    }
  });
}
module.exports = new Installer();