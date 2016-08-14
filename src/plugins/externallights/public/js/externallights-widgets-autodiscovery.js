/*
  Running this within a function prevents leaking variables
  in to the global namespace.
*/
(function (window) {
  'use strict';
  var widgets = namespace('widgets');
  widgets['orov-external-brightness-indicator'] = {
    name: 'orov-external-brightness-indicator',
    defaultUISymantic: 'system-panel',
    url: 'externallights/orov-external-brightness-indicator.html'
  };
}  // The line below both ends the anonymous function and then calls
   // it passing in the required depenencies.
(window));