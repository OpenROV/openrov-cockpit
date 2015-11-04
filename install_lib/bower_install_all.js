var find = require('findit');
var finder = find(process.cwd());
var bower = require('bower');

var currentdirectory = process.cwd();
var bowersToInstall = [];

finder.on('file', function(file,stat){
  if(file.indexOf("bower.json")>-1){
    console.log("Execute bower install on " + file)
    bowersToInstall.push(file.substring(0, file.lastIndexOf("/")) );
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
  installbower(0,bowersToInstall);
});

var installbower = function(index, array){
  var dir = array[index];
  console.log('======== installing =======');
  console.log(dir);
  bower.commands
  .install(['bower.json'],{ save: false}, { cwd: dir, force:true})
  .on('error', function(err){
      console.error(err.message);
      process.exit(1);
  })
  .on('log', function(info){
      console.log(info.message);
  })
  .on('end', function(installed){
      console.log('done processing plugin install');
      index++;
      if (index<array.length-1){
        installbower(index,array);
      }
  });

};
