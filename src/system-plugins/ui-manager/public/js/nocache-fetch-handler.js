(function(global) {
  global.dontCacheHandler = function(request, values, options){
    return global.fetch(request);
  }  
})(self);