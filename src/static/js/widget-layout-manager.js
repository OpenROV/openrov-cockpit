

$(document).ready(function() {

  window.OROV.layoutConfig = {
    "multipurpose-display": [{
      "tag": "orov-inputs-list",
      "settings": {
        "_linkhref": "input-controller/orov-inputs-list.html"
      }
    }, {
      "tag": "orov-plugin-finder",
      "settings": {
        "_linkhref": "plugin-finder/orov-plugin-finder.html"
      }
    }, {
      "tag": "orov-plugin-manager",
      "settings": {
        "_linkhref": "plugin-manager/orov-plugin-manager.html"
      }
    }, {
      "tag": "orov-software-version",
      "settings": {
        "_linkhref": "software-update-alert/orov-software-version.html"
      }
    }, {
      "tag": "orov-blackbox",
      "settings": {
        "_linkhref": "blackbox/orov-blackbox.html"
      }
    }, {
      "tag": "orov-settings-manager",
      "settings": {
        "_linkhref": "settings-manager/orov-settings-manager.html"
      }
    }, {
      "tag": "orov-telemetry-monitor",
      "settings": {
        "_linkhref": "telemetry/orov-telemetry-monitor.html"
      }
    }, {
      "tag": "orov-thrusters2x1-motortest",
      "settings": {
        "_linkhref": "thrusters2x1/orov-thrusters2x1-motortest.html"
      }
    }],
    "system-panel": [{
      "tag": "orov-blackbox-status",
      "settings": {
        "_linkhref": "blackbox/orov-blackbox-status.html"
      }
    },
    {
      "tag": "orov-telemetry-item",
      "settings": {
        "telemetryItem" : "vout",
        "_linkhref": "telemetry/telemetry-item.html"
      }
    },
    {
      "tag": "orov-servo-tilt",
      "settings": {
        "imgSrc": "url('data:image/png;base64,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')",
        "_linkhref": "camera-tilt/orov-servo-tilt.html"
      }
    }, {
      "tag": "orov-external-brightness-indicator",
      "settings": {
        "_linkhref": "externallights/orov-external-brightness-indicator.html"
      }
    }, {
      "tag": "orov-lasers",
      "settings": {
        "_linkhref": "lasers/orov-lasers.html"
      }
    }, {
      "tag": "brightness-indicator",
      "settings": {
        "_linkhref": "lights/brightness-indicator.html"
      }
    }],
    "data-control-unit": [{
      "tag": "orov-connection-health",
      "settings": {
        "_linkhref": "connection-health/orov-connection-health.html"
      }
    }, {
      "tag": "orov-ping-graph",
      "settings": {
        "_linkhref": "connection-health/orov-ping-graph.html"
      }
    }],
    "flight-control-state": [{
      "tag": "orov-events-graph",
      "settings": {
        "_linkhref": "host-diagnostics/events-graph.html"
      }
    }, {
      "tag": "javascript-latency",
      "settings": {
        "_linkhref": "host-diagnostics/javascript-loopspeed.html"
      }
    }, {
      "tag": "orov-thrustfactor",
      "settings": {
        "_linkhref": "rovpilot/orov-thrustfactor.html"
      }
    }, {
      "tag": "orov-serial-monitor",
      "settings": {
        "_linkhref": "serial-monitor/orov-serial-monitor.html"
      }
    }]
  };


  var wid =  window.OROV.layoutConfig;
  Object.keys(wid).forEach(function(section) {
    for (var i in wid[section]){
      var link = document.createElement('link');
      link.href = 'components/'+ wid[section][i].settings._linkhref;
      link.rel = "import";
      link.async = false;
      document.head.appendChild(link);
    }
  });
/*

  var wid =  window.OROV.widgets;
  Object.keys(wid).forEach(function(src) {
    var link = document.createElement('link');
    link.href = 'components/'+ wid[src].url;
    link.rel = "import";
    link.async = false;
    document.head.appendChild(link);
  });
*/
// blank
/*
{
  "tag": "telemetry-item",
  "settings": {
    "telemetryItem" : "vout"
  }
},
*/


  window.addEventListener('WebComponentsReady', function(e) {
    var savedConfig =  window.OROV.layoutConfig
    var k = Object.keys(savedConfig);
    for (var i in k){
      var area = $('#' + k[i]);
      for (var j in savedConfig[k[i]]){
        var el = document.createElement(savedConfig[k[i]][j].tag);
        if (savedConfig[k[i]][j].tag.startsWith('orov')){
           el.eventEmitter = window.cockpit;
        }

        for (var l in el.properties){
          if ((el.properties[l].persisted) && (l in savedConfig[k[i]][j].settings )){
            el[l] = savedConfig[k[i]][j].settings[l];
          }
        }


        area.append(el);
      }
    }
  });

  window.addEventListener('NOWebComponentsReady', function(e) {


    var wid =  window.OROV.widgets;
    var config = {};
  //  $('#t')[0]['system-panel-widgets'] = wid;
    console.dir(wid);
    for( var i in wid){
      var el1 = document.createElement(wid[i].name);
      if(wid[i].name.startsWith('orov')){
        el1.eventEmitter = window.cockpit;
      }
      el1._linkhref = wid[i].url;
      $('#'+wid[i].defaultUISymantic).append(el1);
      // --
      if (config[wid[i].defaultUISymantic]===undefined){
        config[wid[i].defaultUISymantic] = [];
      }
      var econfig = {};
      for (var j in el1.properties){
        if (el1.properties[j].persisted){
          econfig[j] = el1[j];
          console.log(j + ' = ' +el1[j] );
        }
      }
      econfig._linkhref = wid[i].url;
      var edetail = {tag: wid[i].name, settings: econfig};
      config[wid[i].defaultUISymantic].push(edetail);

    }
    var report = document.createElement("textarea");
    report.value = JSON.stringify(config);
    $('body').append(report);

  });
});
