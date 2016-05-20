/*
  Running this within a function prevents leaking variables
  in to the global namespace.
*/
(function(window) {
  'use strict';
  var widgets = namespace('widgets');

  widgets['orov-connection-health'] =  {
      name:'orov-connection-health',
      defaultUISymantic: 'data-control-unit',
      url: 'connection-health/orov-connection-health.html'
    };
  widgets['orov-ping-graph'] =  {
      name:'orov-ping-graph',
      defaultUISymantic: 'data-control-unit',
      url: 'connection-health/orov-ping-graph.html'
    };

}
// The line below both ends the anonymous function and then calls
// it passing in the required depenencies.
)(window);
