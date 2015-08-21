/*
  Running this within a function prevents leaking variables
  in to the global namespace.
*/
(function(window) {
  'use strict';
  var widgets = namespace('widgets');

  widgets['telemetry-monitor'] =  {
      name:'telemetry-monitor',
      defaultUISymantic: 'multipurpose-display',
      url: urlOfJsFile('telemetry-widgets-autodiscovery.js')+'../webcomponents/telemetry-monitor.html'
    };

}
// The line below both ends the anonymous function and then calls
// it passing in the required depenencies.
)(window);
