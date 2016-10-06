/*
  Running this within a function prevents leaking variables
  in to the global namespace.
*/
(function (window) {
  'use strict';
  var widgets = namespace('widgets');
  widgets['orov-example'] = {
    name: 'orov-example',
    defaultUISymantic: 'data-control-unit',
    url: 'example/example.html'
  };
}  // The line below both ends the anonymous function and then calls
   // it passing in the required depenencies.
(window));