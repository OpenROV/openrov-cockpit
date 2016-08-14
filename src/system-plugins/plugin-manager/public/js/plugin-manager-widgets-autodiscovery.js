/*
  Running this within a function prevents leaking variables
  in to the global namespace.
*/
(function (window) {
  'use strict';
  var widgets = namespace('widgets');
  widgets['orov-plugin-manager'] = {
    name: 'orov-plugin-manager',
    defaultUISymantic: 'multipurpose-display',
    url: 'plugin-manager/orov-plugin-manager.html'
  };
}  // The line below both ends the anonymous function and then calls
   // it passing in the required depenencies.
(window));