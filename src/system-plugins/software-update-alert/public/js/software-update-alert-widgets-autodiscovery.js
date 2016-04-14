/*
  Running this within a function prevents leaking variables
  in to the global namespace.
*/
(function(window) {
  'use strict';
  var widgets = namespace('widgets');

  widgets['orov-software-version'] =  {
      name:'orov-software-version',
      defaultUISymantic: 'multipurpose-display',
      url: 'software-update-alert/orov-software-version.html'
    };

}
// The line below both ends the anonymous function and then calls
// it passing in the required depenencies.
)(window);
