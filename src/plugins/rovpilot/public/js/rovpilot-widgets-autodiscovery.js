/*
  Running this within a function prevents leaking variables
  in to the global namespace.
*/
(function (window) {
  'use strict';
  var widgets = namespace('widgets');
  widgets['orov-thrustfactor'] = {
    name: 'orov-thrustfactor',
    defaultUISymantic: 'flight-control-state',
    url: 'rovpilot/orov-thrustfactor.html'
  };
}  // The line below both ends the anonymous function and then calls
   // it passing in the required depenencies.
(window));