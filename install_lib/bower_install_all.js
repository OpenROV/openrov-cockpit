var find = require('findit');
var path = require('path');
var finder = find(process.cwd());
var bower = require('bower');
var rimraf = require('rimraf');
var currentdirectory = process.cwd();
var bowersToInstall = [];
bowersToInstall.push(path.join(process.cwd(),'/src/static'));

finder.on('file', function (file, stat) {
  if (file.indexOf('bower.json') > -1) {
    console.log('Execute bower install on ' + file);
    if (!bowersToInstall.includes(file.substring(0, file.lastIndexOf('/')))){
      bowersToInstall.push(file.substring(0, file.lastIndexOf('/')));
    }
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
  installbower(0, bowersToInstall);
});
var packed_root = null;
var packed_dir = null
if (process.env.PACKDIR){
  packed_root = path.dirname(process.env.PACKDIR);
  packed_basename = path.basename(process.env.PACKDIR);
}
var installbower = function (index, array) {
  var dir = array[index];
  console.log('======== cleaning =======');
  console.log(dir + '/bower_components');
 // rimraf(dir + '/bower_components', function () {
    console.log('======== installing =======');
    console.log(dir);
    console.log(process.env.PACKDIR)
    bower.commands.install([], {
      save: false,
      forceLatest: true
    }, { cwd: dir, directory:process.env.PACKDIR }).on('error', function (err) {
      console.error(err.message);
      process.exit(1);
    }).on('log', function (info) {
      console.log(info.message);
    }).on('end', function (installed) {
      console.log('done processing plugin install');
      index++;
      if (index < array.length) {
        installbower(index, array);
      }
    });

 // });
};
