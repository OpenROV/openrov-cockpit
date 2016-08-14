/*
  Running this within a function prevents leaking variables
  in to the global namespace.
*/
(function (window) {
  'use strict';
  var widgets = namespace('widgets');
  widgets['orov-inputs-list'] = {
    name: 'orov-inputs-list',
    defaultUISymantic: 'multipurpose-display',
    url: 'input-controller/orov-inputs-list.html'
  };
}  // The line below both ends the anonymous function and then calls
   // it passing in the required depenencies.
(window));