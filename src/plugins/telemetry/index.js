function telemetry(name, deps) {
  console.log('This is where Telemetry code would execute in the node process.');

  var statusdata = {};

  deps.globalEventLoop.on( 'mcu.status', function(data){
    for (var i in data) {
      if (i === 'cmd'){
        //filter out ping command echos
        if (data[i].indexOf('ping')>=0) continue;
      }
      statusdata[i] = data[i];
    }
  });


  setInterval(function () {
    deps.cockpit.emit('plugin.telemetry.logData', statusdata);
  }, 1000);



}
module.exports = function (name, deps) {
  return new telemetry(name,deps);
};
