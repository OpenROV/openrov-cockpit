/*
  Running this within a function prevents leaking variables
  in to the global namespace.
*/
(function (window) {
  'use strict';
  var widgets = namespace('widgets');
  widgets['orov-video'] = {
    name: 'orov-video',
    defaultUISymantic: 'data-control-unit',
    url: 'video/video.html'
  };
}  // The line below both ends the anonymous function and then calls
   // it passing in the required depenencies.
(window));