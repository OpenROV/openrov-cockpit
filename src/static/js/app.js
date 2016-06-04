//This is the support file for the /views/index.ejs
$(function () {  
  //http://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript
  function getParameterByName(name, url) {
      if (!url) url = window.location.href;
      name = name.replace(/[\[\]]/g, "\\$&");
      var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
          results = regex.exec(url);
      if (!results) return null;
      if (!results[2]) return '';
      return decodeURIComponent(results[2].replace(/\+/g, " "));
  }
  
  function setGetParameter(paramName, paramValue)
{
    var url = window.location.href;
    var hash = location.hash;
    url = url.replace(hash, '');
    if (url.indexOf(paramName + "=") >= 0)
    {
        var prefix = url.substring(0, url.indexOf(paramName));
        var suffix = url.substring(url.indexOf(paramName));
        suffix = suffix.substring(suffix.indexOf("=") + 1);
        suffix = (suffix.indexOf("&") >= 0) ? suffix.substring(suffix.indexOf("&")) : "";
        if (paramValue==null){
          url = prefix + suffix;            
        } else {
          url = prefix + paramName + "=" + paramValue + suffix;
        }
    }
    else
    {
    if (url.indexOf("?") < 0)
        url += "?" + paramName + "=" + paramValue;
    else
        url += "&" + paramName + "=" + paramValue;
    }
    window.location.href = url + hash;
}
  
  var force=getParameterByName('force'); //resets the pilot position reservation
  force=force==null?false:true;
  var mc=getParameterByName('mc'); //forces going to mission control
  
  var e = new EventEmitter2();
  e.ThisIsTheOne=true;
  var blacklist=[
      'CameraRegistration'
  ];
  var lvcCacheJSON = localStorage.getItem('lvc_cache');
  var cacheSeed = {};
  if (lvcCacheJSON !== null){
      var lvcCache = JSON.parse(lvcCacheJSON);
      var lvcArray = Object.keys(lvcCache);
      lvcArray.forEach(function(key){
          if (blacklist.includes(key)){return;}
          var parms = lvcCache[key];
   //       parms.unshift(key);
          cacheSeed[key]={context:this,args:parms}
          console.log('seeding event:',key);
      });
  }
  
    e = new window.EventEmiiterStoreAndForward(e,cacheSeed);
  
  var cockpit = new Cockpit(e);
  window.cockpit = cockpit;  
  $('#t')[0]['rovOnline']=false;

  if (mc!==null){
     loadScript('js/missioncontrol.js'); 
     //$.getScript('js/missioncontrol.js');
     return;
  }     
  var tokenOption=force==false?sessionStorage.sessionID:'reset';
  var socket = window.io.connect(window.location.protocol + '//' +
                window.location.hostname+ ':' +  window.location.port,{path:'/cockpitsocket', query: 'token='+tokenOption  });
  socket=new window.SocketIOStoreAndForward(socket);
 // socket=new window.SocketIOEmitter(socket);
 
 
  socket.on('error',function(error){
      if (error == "Authentication error"){
          console.log("Someone else already logged in to rov Pilot slot, redirecting to mission control");
          setGetParameter('mc',true);
          loadScript('js/missioncontrol.js'); 
          return;
      }
  });
  
  socket.on('forced-disconnect',function(){
      window.location.reload();
  });
  
  socket.on('connect',function(){

    var CacheLVC = function(lvcdumpfn,millseconds){
        var cache = lvcdumpfn();
        localStorage.setItem('lvc_cache', JSON.stringify(cache));
        setTimeout(CacheLVC.bind(this,lvcdumpfn,millseconds),millseconds);
    }

    //plugin hooks
    socket.emit('request-sessionToken',function(sessionID){
           sessionStorage.sessionID = sessionID; 
           var bridge = new window.SocketIOtoEmitterBridge(socket,window.cockpit.rov);
           
           $('#t')[0]['rovOnline']=true;
           $('#t')[0]['userRole']='Pilot';
           window.cockpit.rov.connection='socket.io';
           var lvcCache={};           
           if(lvcCacheJSON!==null){
               lvcCache=JSON.parse(lvcCacheJSON);
           }
           
           //if they forced the session connect, we need to remove the parameter from the URL
           if (force){
               setGetParameter('force',null);
           }

            socket.lvcCache=lvcCache;    
                    
           //TESTING: Danger, if the serialization takes to long it might look like a hitch to performance every 3 minutes
           CacheLVC(function(){return lvcCache},1000*10*3);
    });      
  })
  
    

});
