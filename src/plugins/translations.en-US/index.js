var fs=require('fs');

function TranslationEnUS(name, deps) {
  console.log('TranslationEnUS plugin loaded.');
  var updates = {};
  var updates_dirty = false;

  deps.app.get('/locales/en-US/:namespace', function (req, res) {
    var namespace = req.params.namespace;
    if (namespace.indexOf('.json')<0){
      namespace = namespace+'.json';
    }
    var file = __dirname + '/' + namespace;
    console.log(file);

    fs.existsSync(file,function(exists){
      if (exists) return;
      console.write("Creating file: "+file);
      fs.writeFileSync(file, '{}');
    });

    fs.readFile(file,function (err, data){
        console.log("In right function");
        res.writeHead(200, {'Content-Type': 'text/html','Content-Length':data.length});
        res.write(data);
        res.end();
    });
  });

  deps.app.post('/locales/add/en-US/:namespace', function (req, res) {
    var ns = req.params.namespace;
    var newdata = req.body;
    var keys = Object.keys(newdata);
    if (updates[ns] === undefined) { updates[ns] = {}};
    for(i in keys){
     updates[ns][keys[i]]=newdata[keys[i]].replace(req.params.namespace+':::', "");;
    }
    res.status(200);
    res.end();
    updates_dirty=true;
  });

  setInterval(function(){
    if (!updates_dirty) return;

    var nskeys = Object.keys(updates);
    nskeys.forEach(function(key){
      var file = __dirname + '/' + key + '.json';
      fs.existsSync(file,function(exists){
        if (exists) return;
        fs.writeFileSync(file, '{}');
      });
      var _updates = updates[key];
      fs.readFile(file,function (err, data){
        var itemkeys = Object.keys(_updates);
        var json = JSON.parse(data);
        itemkeys.forEach(function(ikeys){
          json[ikeys]=_updates[ikeys];
        });
        var newJSON = JSON.stringify(json, null, 2);
        fs.writeFileSync(file, newJSON);
      });
    });
    updates = {};
    updates_dirty = false;
  },5000);
};

module.exports = function (name, deps) {
  return new TranslationEnUS(name,deps);
};
