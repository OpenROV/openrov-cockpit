/*  This is a good place to link up the controls to the larger
    page concerns.  If the UI composition stays a control, we
    should really pass in the depenecies so that we don't have
    to directly access the window global object space as children
    objects should never know about their parent containers.
*/

/*
  Dynamically add link files for widgets, hopefully blocking
  while loading per the script example: http://www.html5rocks.com/en/tutorials/speed/script-loading/
*/
$( document ).ready(function() {
  var wid =  window.OROV.widgets;

  Object.keys(wid).forEach(function(src) {
    var link = document.createElement('link');
    link.href = wid[src].url;
    link.rel = "import";
    link.async = false;
    document.head.appendChild(link);
  });


/* Telemetry Hooks
window.cockpit.rov.on('plugin.telemetry.cycleTextColor', function () {
  $('#telemetry').cycleTextColor();
});

window.cockpit.rov.on('plugin.telemetry.logData', function (data) {
  $('#telemetry').logStatusData(data);
});

$('#telemetry').define = function(name,callback){
  window.cockpit.rov.emit('telemetry.getDefinition',name,callback);
};
*/



//var wid =  [window.OROV.widgets["servo-tilt"]];
//$.getScript(wid[0].url);

window.cockpit.rov.onAny(function(data) {
//  $('servo-tilt')[0].servoAngle = angle;
console.log(this.event);
//plugin.cameraTilt.angle
$('#t')[0][this.event.replace(/\./g,"_")] = data;
});

$('#t')[0]['cockpit-event-emitter'] = window.cockpit;

/*          <% for(var i=0; i<ui.systempanel.length; i++) {%>
          <<%ui.systempanel[i].name %> event-emitter={{cockpit-event-emitter}}></<%ui.systempanel[i].name %>>
          <% } %>
*/


window.addEventListener('WebComponentsReady', function(e) {
  var wid =  window.OROV.widgets;
//  $('#t')[0]['system-panel-widgets'] = wid;
  console.dir(wid);
  for( var i in wid){
    var el1 = document.createElement(wid[i].name);
    $('#'+wid[i].defaultUISymantic).append(el1);
  }
});
});
