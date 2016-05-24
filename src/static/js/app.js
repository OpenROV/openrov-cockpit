//This is the support file for the /views/index.ejs
$(function () {
    var socket = window.io.connect(window.location.protocol + '//' +
                 window.location.hostname+ ':' +  window.location.port,{path:'/cockpitsocket'});
    socket=new window.SocketIOStoreAndForward(socket);
    socket=new window.SocketIOEmitter(socket);

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
  
  var force=getParameterByName('force');
  force=force==null?false:true;
  
  
  //plugin hooks
  socket.emit('doIhaveTheBall',force,function(hastheball){
    if (hastheball){
      var cockpit = new Cockpit(socket);
      cockpit.rov.on('cockpit.pluginsLoaded', function() {
      });
      window.cockpit = cockpit;  
    } else {
      //Someone else is directly connected, attempt to peer connect to them
      socket.emit('end');
      $.getScript('js/missioncontrol.js');
    }  
  });  

});
