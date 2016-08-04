(function (window, $, undefined) {
  'use strict';
  if (window.openrovtheme!=='new-ui') return;
  var plugins = namespace('plugins');
  plugins.NewUI = function NewUI(cockpit) {

    var jsFileLocation = urlOfJsFile('new-ui.js');
    this.cockpit = cockpit;
    this.name = 'new-ui';   // for the settings
    this.viewName = 'New UI'; // for the UI

    this.WhenVisible('#time-item',function(){
      $('#time-item').css('visibility','visible');
      $('#time-item-collapsed').hide();
    },function(){
      $('#time-item').css('visibility','hidden');
      $('#time-item-collapsed').show();
    })

    this.WhenVisible('#power-item',function(){
      $('#power-item').css('visibility','visible');
      $('#power-item-collapsed').hide();
    },function(){
      $('#power-item').css('visibility','hidden');
      $('#power-item-collapsed').show();
    })    

  };

  plugins.NewUI.prototype.WhenVisible=function(element,visibleCallback,obstructedCallback){
   var fn = function(){
      var win = $(window);
      var el = $(element);
      if (el.offset()==undefined) return;
      var winPos = win.scrollTop() + win.height();
      var elPos = el.offset().top + el.height();

      if( winPos > elPos ) {
          visibleCallback(el);
      }  else {
          obstructedCallback(el);
      }     
   }

    $( window ).resize(function() {
      fn();
    })   

   //This is a super hack, trying to find something that fires after
   //the DOM has painted so that the elements have their position information.
   //Right now, simply waiting 5 seconds and then manually checking the 
   //position of the element.  
   //TODO: Still need to find a way to initiate the check after the
   //dom-if fires on the template
   window.addEventListener('WebComponentsReady', function(e) {
     setTimeout(fn,5000);
   });   
  }

  plugins.NewUI.prototype.listen = function listen(){
    // Fixes timing issues with existence of cockpit_int at time of initial call
    // TODO: Can we code startup in a way where this doesnt happen? Where else might this be happening?
    if (window.cockpit_int === undefined)
    {
      setTimeout(this.listen.bind(this),250);
      return;
    }
    else if( window.cockpit_int.i18n === undefined )
    {
        setTimeout(this.listen.bind(this),250);
        return;
    }

    window.cockpit_int.i18n.loadNamespace('new-ui', function() {  });
    var key_s = window.cockpit_int.i18n.options.keyseparator;
    var ns_s =  window.cockpit_int.i18n.options.nsseparator;
    var prefix = 'new-ui';
    $('#t')[0]['__']=function(str){
      window.cockpit_int.i18n.options.ns.defaultNs = prefix
      return window.cockpit_int.__(str);
    };

  }

  plugins.NewUI.prototype.inputDefaults = function inputDefaults(){
    var self = this;
    return [{
      name: 'newUi.showTelemetry',
      description: 'Show the telemetry window.',
      defaults: { keyboard: 'alt+t' },
      down: function () {
        var telemetryWindow = window.open('new-ui/telemetry', '__telemetry', 'menubar=no, status=no, titlebar=no, toolbar=no, width=300, height=400, location=no');
        telemetryWindow.cockpit = window.cockpit;
      }
    },
    {
      name: 'newUi.showSerialMonitor',
      description: 'Show the serial port window.',
      defaults: { keyboard: 'alt+s' },
      down: function () {
        var serialWindow = window.open('new-ui/serial-monitor', '__serial-monitor', 'menubar=no, status=no, titlebar=no, toolbar=no, width=300, height=400, location=no');
        serialWindow.cockpit = window.cockpit;
      }
    }
    ];
  };
  window.Cockpit.plugins.push(plugins.NewUI);
}(window, jQuery));
