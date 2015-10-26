/*
  Running this within a function prevents leaking variables
  in to the global namespace.
*/
(function(window) {
  'use strict';
  var widgets = namespace('widgets');

  widgets['orov-events-graph'] =  {
      name:'orov-events-graph',
      defaultUISymantic: 'flight-control-state',
      url: 'host-diagnostics/events-graph.html'
    };

    widgets['javascript-latency'] =  {
        name:'javascript-latency',
        defaultUISymantic: 'flight-control-state',
        url: 'host-diagnostics/javascript-loopspeed.html'
      };

}
// The line below both ends the anonymous function and then calls
// it passing in the required depenencies.
)(window);
