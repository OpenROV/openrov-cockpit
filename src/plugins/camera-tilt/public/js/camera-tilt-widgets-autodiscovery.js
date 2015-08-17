/*
  Running this within a function prevents leaking variables
  in to the global namespace.
*/
(function(window) {
  'use strict';
  var widgets = namespace('widgets');

  widgets['servo-tilt'] =  {
      name:'servo-tilt',
      defaultUISymantic: 'system-panel',
      url: urlOfJsFile('camera-tilt-widgets-autodiscovery.js')+'../webcomponents/servo-tilt.html'
    };

}
// The line below both ends the anonymous function and then calls
// it passing in the required depenencies.
)(window);
