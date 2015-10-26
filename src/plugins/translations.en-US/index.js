var TranslationResourceManager=require('orov.TranslationResourceManager');
module.exports = function (name, deps) {
  var options = {
    addMissingTranslations:true
  }
  return new TranslationResourceManager('en-US',deps.app,__dirname,options);
};
