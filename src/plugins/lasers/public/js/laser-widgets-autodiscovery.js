/*
  Running this within a function prevents leaking variables
  in to the global namespace.
*/
(function(window) {
  'use strict';
  var widgets = namespace('widgets');

  widgets['orov-laser'] =  {
      name:'orov-laser',
      defaultUISymantic: 'system-panel',
      url: urlOfJsFile('laser-widgets-autodiscovery.js')+'../webcomponents/orov-laser.html'
    };

}
// The line below both ends the anonymous function and then calls
// it passing in the required depenencies.
)(window);
