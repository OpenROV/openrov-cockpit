$.getScript('components/i18next/i18next-latest.js',function(){
  //http://i18next.com/pages/doc_init.html
  if (window.cockpit_int !== undefined) return;
  i18n.init({
    lng: "en-US",
    sendMissing: true,
    resPostPath: 'locales/add/__lng__/__ns__',
    sendMissingTo: 'current',
    nsseparator : ':::',
    keyseparator : '::',
    load: "current",
    fallbackLng: "en-US"
  }, function(err, t) {
    window.cockpit_int = {};
    window.cockpit_int.__=i18n.t;
    window.cockpit_int.i18n = i18n;
    var test = window.cockpit_int.__('This is a test');
    console.log(test);
    });
    // programatical access
//      var appName = t("app.name");
  });
