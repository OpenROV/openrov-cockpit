(function (window, document, $) {
  'use strict';
window.Cockpit = new window.EventEmiiterStoreAndForward(window.Cockpit);
window.Cockpit.rov = {on: function(){}, off: function(){}, withHistory: {on: function(){}}};
$('#t')[0]['cockpitEventEmitter'] = window.Cockpit;
window.Cockpit.plugins.forEach(function(plugin){
  var p = new plugin(window.Cockpit);
  if (p.listen){
    p.listen();
  }
});
}(window, document, $));
