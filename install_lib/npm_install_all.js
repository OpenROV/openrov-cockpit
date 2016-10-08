var find = require('findit');
var finder = find(process.cwd());
var rimraf = require('rimraf');
const exec = require('child_process').execSync;
var currentdirectory = process.cwd();
var packagesToInstall = [];
var path = require('path');

finder.on('file', function (file, stat) {
  if (file.indexOf('package.json') > -1) {
    console.log(file + ' |||| ' + process.cwd());
    if (path.dirname(file) == process.cwd()) {
      console.log('ignoring: ' + file);
      return;
    }
    console.log('Execute npm install on ' + file);
    packagesToInstall.push(file.substring(0, file.lastIndexOf('/')));
  }
});
finder.on('directory', function (dir, stat, stop) {
  if (dir.indexOf('bower_components') > -1) {
    console.log('Ingnoring ' + dir);
    stop();
  }
  if (dir.indexOf('node_modules') > -1) {
    console.log('Ingnoring ' + dir);
    stop();
  }
  if (dir.indexOf('.git') > -1) {
    console.log('Ingnoring ' + dir);
    stop();
  }
  currentdirectory = dir;
});
finder.on('end', function () {
  installPackages(0, packagesToInstall);
});
var installPackages = function (index, array) {
  var dir = array[index];
  console.log('======== cleaning =======');
  console.log(dir + '/node_modules');
  rimraf(dir + '/node_modules', function () {
    console.log('======== installing =======');
    console.log(dir);
    exec('npm install', { cwd: dir });
    index++;
    if (index < array.length) {
      installPackages(index, array);
    }
  });
};