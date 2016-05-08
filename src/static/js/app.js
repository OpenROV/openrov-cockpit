//This is the support file for the /views/index.ejs
$(function () {
  if (window.io == undefined) {
    console.warn && console.warn("! detected no socket found !");
    var mysocket = function () {
    };
    mysocket.prototype.emit = function (x) {
      console.log(x);
    };
    mysocket.prototype.emit = function (x, y) {
      console.log(x);
      console.log(y);
    };
    simevents = {};
    mysocket.prototype.on = function (x, y) {
      console.log('registering ' + x);
      if (simevents[x] == undefined) {
        simevents[x] = [];
      }
      simevents[x].push(y);
    };
    var io = new mysocket();
    var socket = new mysocket();
    CONFIG = {};
    CONFIG.sample_freq = 20;
  } else {
    var socket = window.io.connect(window.location.protocol + '//' +
                 window.location.hostname+ ':' +  window.location.port,{path:'/cockpitsocket'});
    socket=new window.SocketIOStoreAndForward(socket);
    socket=new window.SocketIOEmitter(socket);
  }


  //plugin hooks
  var cockpit = new Cockpit(socket);
  cockpit.rov.on('cockpit.pluginsLoaded', function() {
  });
  window.cockpit = cockpit;
});
