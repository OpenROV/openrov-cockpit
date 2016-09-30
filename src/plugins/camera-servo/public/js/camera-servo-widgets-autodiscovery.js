/*
  Running this within a function prevents leaking variables
  in to the global namespace.
*/
(function (window) {
  'use strict';
  var widgets = namespace('widgets');
  widgets['orov-servo-tilt'] = {
    name: 'orov-servo-tilt',
    defaultUISymantic: 'system-panel',
    url: 'camera-servo/orov-servo-tilt.html'
  };
}  // The line below both ends the anonymous function and then calls
   // it passing in the required depenencies.
(window));