var find = require('findit');
var finder = find(process.cwd());
var rimraf = require('rimraf');
const exec = require('child_process').execSync;
var currentdirectory = process.cwd();
var packagesToInstall = [];
var path = require('path');
var nodeModulesFolder = path.join(process.cwd(),"node_modules");
var fs = require('fs-extra');

//Fix the issue that npm overwrites the env settings with its current settings after processing the oroginal env settings, but
//it replaces false with "" so that down stream npm calls then treat "" as true :-(
process.env["npm_config_shrinkwrap"]=process.env["npm_config_shrinkwrap"]==true?"true":"false";

//node-gyp throws a fit is this is "false" instead of null/true.  Given the default it false, it should
//not hurt if someone explicitly passes false which will become "" inside this script.
//process.env["npm_config_unsafe_perm"]=process.env["npm_config_unsafe_perm"]==true?"true":"false";

console.log("==ENV settings:==");
console.dir(process.env);
console.log("==NPM settings:==");
var result = exec('npm config ls -l',{encoding:'utf8'});
console.log(result);
//fs.copySync(path.join(currentdirectory,'package.json'),'package.json.orignal');
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
//    fs.copySync(path.join(dir,'package.json'),'package.json');
    try{
      console.log(exec('node --max-old-space-size=300 /usr/local/bin/yarn install --production', {cwd: dir,encoding:'utf8' }));// --modules-folder ' + nodeModulesFolder, { cwd: dir,encoding:'utf8' }));
      index++;
      if (index < array.length) {
        installPackages(index, array);
      } else {
      //  fs.copySync('package.json.orignal','package.json');
      }
    } catch (e){
      console.dir(e);
    //  fs.copySync('package.json.orignal','package.json');
    }
  });
};
