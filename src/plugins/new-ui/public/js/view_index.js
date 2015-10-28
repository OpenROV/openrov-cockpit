//This is the support file for the /views/index.ejs
$(function () {
  $( document ).ready(function() {
    $('#t')[0]['cockpit-event-emitter'] = window.cockpit;

    window.cockpit_int.i18n.loadNamespace('new-ui', function() {  });
    var key_s = window.cockpit_int.i18n.options.keyseparator;
    var ns_s =  window.cockpit_int.i18n.options.nsseparator;
    var prefix = 'new-ui';
    $('#t')[0]['__']=function(str){
      window.cockpit_int.i18n.options.ns.defaultNs = prefix
      return window.cockpit_int.__(str);
    };
  });
});
