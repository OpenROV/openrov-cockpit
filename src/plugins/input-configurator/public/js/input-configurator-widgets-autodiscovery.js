/*
  Running this within a function prevents leaking variables
  in to the global namespace.
*/
(function(window) {
  'use strict';
  var widgets = namespace('widgets');

  widgets['orov-input-configurator'] =  {
      name:'orov-input-configurator',
      defaultUISymantic: 'multipurpose-display',
      url: 'input-configurator/orov-input-configurator.html'
    };

}
// The line below both ends the anonymous function and then calls
// it passing in the required depenencies.
)(window);
