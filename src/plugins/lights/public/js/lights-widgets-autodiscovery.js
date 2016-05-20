/*
  Running this within a function prevents leaking variables
  in to the global namespace.
*/
(function(window) {
  'use strict';
  var widgets = namespace('widgets');

  widgets['brightness-indicator'] =  {
      name:'brightness-indicator',
      defaultUISymantic: 'system-panel',
      url: 'lights/brightness-indicator.html'
    };

}
// The line below both ends the anonymous function and then calls
// it passing in the required depenencies.
)(window);
