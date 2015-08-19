/*
  Running this within a function prevents leaking variables
  in to the global namespace.
*/
(function(window) {
  'use strict';
  var widgets = namespace('widgets');

  widgets['orov-settings-manager'] =  {
      name:'orov-settings-manager',
      defaultUISymantic: 'multipurpose-display',
      url: urlOfJsFile('settings-manager-widgets-autodiscovery.js')+'../webcomponents/orov-settings-manager.html'
    };

}
// The line below both ends the anonymous function and then calls
// it passing in the required depenencies.
)(window);
