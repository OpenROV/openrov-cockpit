(function (window, $, undefined) {
  if (window.openrovtheme!=='theme_r2') return;

  'use strict';
  var ThemeR2;
  ThemeR2 = function ThemeR2(cockpit) {
    console.log('Loading ThemeR2 plugin in the browser.');
    // Instance variables
    this.cockpit = cockpit;

    // for plugin management:
    this.name = 'ThemeR2';   // for the settings
    this.viewName = 'Theme-R2'; // for the UI
    this.canBeDisabled = true; //allow enable/disable
    this.isTheme =true;
    this.enable = function () {
      alert('theme_r2 enabled');
    };
    this.disable = function () {
      alert('theme_r2 disabled');
    };

  };


ThemeR2.prototype.getSettingSchema = function getSettingSchema(){
  return [
    {
        "title": "Theme-R2 Settings",
        "id" : "ThemeR2",
        "type": "object",
        "properties": {}
    }
  ]
}

ThemeR2.prototype.getDefaultConfiguration = function getDefaultConfiguration(){
  return  {
      "ThemeR2":
      {
        "motor-response-delay-ms":0,
        "widgets":
        [
          { "widget1":
            {
              "cssOveride":false,
              "telemetrylist": ["deep","vout"],
              "reverse-modifier":0
            }
          }
        ]
      }
    }
}


//Use inputDefaults to define key commands in the schema such as hiding and showing sections


/*  This is a good place to link up the controls to the larger
    page concerns.  If the UI composition stays a control, we
    should really pass in the depenecies so that we don't have
    to directly access the window global object space as children
    objects should never know about their parent containers.
*/
//$( document ).ready(function() {



/* Telemetry Hooks
window.cockpit.rov.on('plugin.telemetry.cycleTextColor', function () {
  $('#telemetry').cycleTextColor();
});

  $('#telemetry').logStatusData(data);
});

$('#telemetry').define = function(name,callback){
};
*/



//var wid =  [window.OROV.widgets["servo-tilt"]];
//$.getScript(wid[0].url);

//  $('servo-tilt')[0].servoAngle = angle;
//console.log(this.event);
//plugin.cameraTilt.angle


/*          <% for(var i=0; i<ui.systempanel.length; i++) {%>
          <<%ui.systempanel[i].name %> event-emitter={{cockpitEventEmitter}}></<%ui.systempanel[i].name %>>
          <% } %>
*/
})(window,$,undefined);
