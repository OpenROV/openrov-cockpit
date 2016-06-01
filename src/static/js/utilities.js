function msToTime(s) {
  function addZ(n) {
    return (n < 10 ? '0' : '') + n;
  }
  var ms = s % 1000;
  s = (s - ms) / 1000;
  var secs = s % 60;
  s = (s - secs) / 60;
  var mins = s % 60;
  var hrs = (s - mins) / 60;
  return addZ(hrs) + ':' + addZ(mins) + ':' + addZ(secs);  // + '.' + ms;
}

// used to dynamically load plugin assets
function urlOfJsFile ( jsfile ) {
  var scriptElements = document.getElementsByTagName('script');
  var i, element, myfile;
  for( i = 0; element = scriptElements[i]; i++ ) {
    myfile = element.src;
    if( myfile.indexOf( jsfile ) >= 0 ) {
      var myurl = myfile.substring( 0, myfile.indexOf( jsfile ) );
    }
  }
  return myurl;
}

function namespace(namespaceString) {
  if(namespaceString === undefined){
    namespaceString = '';
  }
  var parts = namespaceString.split('.'),
    parent = window,
    currentPart = '';

    if (window.OROV === undefined){
      window.OROV = {};
    }
    parent = window.OROV;

  for(var i = 0, length = parts.length; i < length; i++) {
    currentPart = parts[i];
    parent[currentPart] = parent[currentPart] || {};
    parent = parent[currentPart];
  }

  return parent;
}

//http://stackoverflow.com/posts/8809472/revisions
function generateUUID(){
    var d = new Date().getTime();
    if(window.performance && typeof window.performance.now === "function"){
        d += performance.now(); //use high-precision timer if available
    }
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
    });
    return uuid;
}

//http://balpha.de/2011/10/jquery-script-insertion-and-its-consequences-for-debugging/
var loadScript = function (path) {
  var result = $.Deferred(),
  script = document.createElement("script");
  script.async = "async";
  script.type = "text/javascript";
  script.src = path;
  script.onload = script.onreadystatechange = function (_, isAbort) {
      if (!script.readyState || /loaded|complete/.test(script.readyState)) {
         if (isAbort)
             result.reject();
         else
            result.resolve();
    }
  };
  script.onerror = function () { result.reject(); };
  $("head")[0].appendChild(script);
  return result.promise();
};