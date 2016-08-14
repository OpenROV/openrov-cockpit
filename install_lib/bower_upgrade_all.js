var find = require('findit');
var finder = find(process.cwd());
var ncu = require('npm-check-updates');
var currentdirectory = process.cwd();
var bowersToInstall = [];
finder.on('file', function (file, stat) {
  if (file.indexOf('bower.json') > -1) {
    console.log('Execute bower install on ' + file);
    bowersToInstall.push(file);
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
  console.log('====== upgrading ======');
  installbower(0, bowersToInstall);  //console.dir(bowersToInstall);
});
var result = '';
var installbower = function (index, array) {
  var file = array[index];
  console.log('======== installing =======');
  console.log(file);
  ncu.run({
    packageFile: file,
    packageManager: 'bower',
    upgrade: true,
    upgradeall: true,
    jsonUpgraded: false
  }).then(function (upgraded) {
    console.log('dependencies to upgrade:', upgraded);
    index++;
    if (index < array.length) {
      installbower(index, array);
    }
  });
};