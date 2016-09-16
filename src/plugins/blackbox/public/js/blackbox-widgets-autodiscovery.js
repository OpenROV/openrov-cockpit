/*
  Running this within a function prevents leaking variables
  in to the global namespace.
*/
(function (window) {
  'use strict';
  var widgets = namespace('widgets');
  widgets['orov-blackbox'] = {
    name: 'orov-blackbox',
    defaultUISymantic: 'multipurpose-display',
    url: 'blackbox/orov-blackbox.html'
  };
  widgets['orov-blackbox-status'] = {
    name: 'orov-blackbox-status',
    defaultUISymantic: 'system-panel',
    url: 'blackbox/orov-blackbox-status.html'
  };
}  // The line below both ends the anonymous function and then calls
   // it passing in the required depenencies.
(window));