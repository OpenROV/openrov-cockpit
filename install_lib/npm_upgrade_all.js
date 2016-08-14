var find = require('findit');
var finder = find(process.cwd());
var ncu = require('npm-check-updates');

var currentdirectory = process.cwd();
var npmsToInstall = [];

finder.on('file', function(file,stat){
  if(file.indexOf("package.json")>-1){
    console.log("Examining package: " + file)
    npmsToInstall.push(file);
  }
});

finder.on('directory', function(dir,stat,stop){
  if (dir.indexOf("bower_components")>-1){
    console.log("Ingnoring " + dir)
    stop();
  }
  if (dir.indexOf("node_modules")>-1){
    console.log("Ingnoring " + dir)
    stop();
  }
  if (dir.indexOf(".git")>-1){
    console.log("Ingnoring " + dir)
    stop();
  }
  currentdirectory = dir;
});

finder.on('end', function(){
  console.log('====== upgrading ======');
  installnpm(0,npmsToInstall);
  //console.dir(bowersToInstall);
});

var result = "";
var installnpm = function(index, array){
  var file = array[index];
  console.log('======== installing =======');
  console.log(file);
  ncu.run({
      packageFile: file,
      packageManager: 'npm',
      upgrade: true,
      upgradeall: true,
      jsonUpgraded:false
      // Any command-line option can be specified here.
      // These are set by default:
      // silent: true,
      // jsonUpgraded: true
  }).then(function(upgraded) {
      console.log('dependencies to upgrade:', upgraded);
      index++;
      if (index<array.length){
        installnpm(index,array);
      }
  });


};
