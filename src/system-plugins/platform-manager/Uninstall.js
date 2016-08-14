#!/usr/bin/env node
var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));
var path = require('path');
var exec = require('child_process').exec;
var platformName = '';
var Installer = require('/opt/openrov/cockpit/src/lib/Installer.js');
fs.readFileAsync('/opt/openrov/system/config/platform.conf').then(function (data) {
  // Parse platform info from configuration file
  var platInfo = JSON.parse(data);
  platformName = platInfo.platform;
  if (platformName == '') {
    throw 'No platform specified';
  }
  return platformName;
}).then(function () {
  var installDir = path.join('/opt/openrov/cockpit/src/system-plugins/platform-manager/platforms', platformName, 'install');
  // Install board files
  return Installer.Uninstall(installDir);
}).catch(function (err) {
  console.log('Error: ' + err.message);
  process.exit(1);
}).then(function () {
  console.log('Uninstall complete.');
  process.exit(0);
});