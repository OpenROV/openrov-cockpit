var find = require('findit');
var finder = find(process.cwd());
var rimraf = require('rimraf');
const exec = require('child_process').execSync;
var currentdirectory = process.cwd();
var packagesToInstall = [];
var path = require('path');
const fs = require('fs');

finder.on('file', function (file, stat) {
  if (file.indexOf('package.json') > -1) {
    console.log(file + ' |||| ' + process.cwd());
   // if (path.dirname(file) == process.cwd()) {
   //   console.log('ignoring: ' + file);
   //   return;
   // }
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
  fixPackages(0, packagesToInstall);
});
var fixPackages = function (index, array) {
  var dir = array[index];
  //Now cleanup NPMs STUPID use of including optional dependencies https://github.com/npm/npm/issues/2679 that is a won't fix
  var package=require(path.join(dir,'package.json'));
  if (package.optionalDependencies){
    console.log("fixing optionalDependencies in ",path.join(dir,'package.json'));
    var optionalDeps = Object.keys(package.optionalDependencies);
    var npmShrinkwrap = require(path.join(dir,'npm-shrinkwrap.json'));
    optionalDeps.forEach(function(optionalDep) {
          delete npmShrinkwrap.dependencies[optionalDep];
    });  
    fs.writeFileSync(path.join(dir,'npm-shrinkwrap.json'), JSON.stringify(npmShrinkwrap, null, 4), 'utf8');
  }
  index++;
  if (index < array.length) {
    fixPackages(index, array);
  }
};