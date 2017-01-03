#!/usr/bin/env node
var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));
var path = require('path');
var exec = require('child_process').exec;
var platformName = '';
var Installer = require('/opt/openrov/cockpit/src/lib/Installer.js');
var logger = require('AppFramework.js').logger;
fs.readFileAsync('/opt/openrov/system/config/platform.conf').then(function (data) {
  // Parse platform info from configuration file
  var platInfo = JSON.parse(data);
  platformName = platInfo.platform;
  if (platformName == '') {
    throw 'No platform specified';
  }
  return platformName;
}).then(function () {
  // Install shared stage
  var installDir = '/opt/openrov/cockpit/src/system-plugins/platform-manager/install';
  // Install board files
  return Installer.Install(installDir);
}).then(function () {
  // Install platform specific stage
  var installDir = path.join('/opt/openrov/cockpit/src/system-plugins/platform-manager/platforms', platformName, 'install');
  // Install board files
  return Installer.Install(installDir);
}).catch(function (err) {
  logger.error(err);
  process.exit(1);
}).then(function () {
  logger.debug('Install complete.');
  process.exit(0);
});