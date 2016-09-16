/*
  Running this within a function prevents leaking variables
  in to the global namespace.
*/
(function (window) {
  'use strict';
  var widgets = namespace('widgets');
  widgets['orov-serial-monitor'] = {
    name: 'orov-serial-monitor',
    defaultUISymantic: 'flight-control-state',
    url: 'serial-monitor/orov-serial-monitor.html'
  };
}  // The line below both ends the anonymous function and then calls
   // it passing in the required depenencies.
(window));