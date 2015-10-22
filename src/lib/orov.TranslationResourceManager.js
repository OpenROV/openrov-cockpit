var fs=require('fs');
var TranslationResourceManager = function TranslationResourceManager(lang,httpRouter,resourceFilePath,options){
  this.lang = lang;
  this.router= httpRouter;
  this.dirname = resourceFilePath;
  this.namespaceSeperator = options.namespaceSeperator || ':::';
  this.keySeperator = options.keySeperator || '::';
  this.addMissingTranslations = options.addMissingTranslations || false;

  this.updatesCache = {};
  this.updatesCache_dirty = false;

  if(this.addMissingTranslations){
    this.monitorMissingData();
  }

  this.setRoutes();
}

TranslationResourceManager.prototype.monitorMissingData = function monitorMissingData(){
  var self = this;
  var writeDataToFileInterval = setInterval(function(){
    if (!self.updatesCache_dirty) return;

    var nskeys = Object.keys(self.updatesCache);
    nskeys.forEach(function(key){
      var file = self.dirname + '/' + key + '.json';
      fs.exists(file,function(exists){
        if (exists) return;
        fs.writeFileSync(file, '{}');
      });
      var _updates = self.updatesCache[key];
      fs.readFile(file,function (err, data){
        if (err) {
          return console.log(err);
        }
        var itemkeys = Object.keys(_updates);
        var json = JSON.parse(data);
        itemkeys.forEach(function(ikeys){
          json[ikeys]=_updates[ikeys];
        });
        var newJSON = JSON.stringify(json, null, 2);
        fs.writeFileSync(file, newJSON);
      });
    });
    self.updatesCache = {};
    self.updatesCache_dirty = false;
  },5000);
}

TranslationResourceManager.prototype.setRoutes = function setRoutes(){
  var self=this;
  this.router.get('/locales/'+this.lang+'/:namespace', function (req, res) {
    var namespace = req.params.namespace;
    if (namespace.indexOf('.json')<0){
      namespace = namespace+'.json';
    }
    var file = self.dirname + '/' + namespace;

    fs.exists(file,function(exists){
      if (exists) return;
      fs.writeFileSync(file, '{}');
    });

    fs.readFile(file,function (err, data){
        if (err) {
          res.status(500);
//          res.write(err)
          res.end;
          return console.log(err);
        }
        res.writeHead(200, {'Content-Type': 'text/html','Content-Length':data.length});
        res.write(data);
        res.end();
    });
  });

  this.router.post('/locales/add/'+this.lang+'/:namespace', function (req, res) {
    var ns = req.params.namespace;
    var newdata = req.body;
    var keys = Object.keys(newdata);
    if (self.updatesCache[ns] === undefined) { self.updatesCache[ns] = {}};
    for(i in keys){
     self.updatesCache[ns][keys[i]]=newdata[keys[i]].replace(req.params.namespace+self.namespaceSeperator, "");;
    }
    res.status(200);
    res.end();
    self.updatesCache_dirty=true;
  });

}
module.exports=TranslationResourceManager;
