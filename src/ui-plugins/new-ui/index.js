function newUi(name, deps) {
  console.log('New UI plugin loaded.');

  deps.app.get('/new-ui/telemetry', function(req, res) {
    var scriptBlock = [
      'window.opener.cockpit.rov.on("plugin.telemetry.logData", function (data) { ',
      'document.getElementById("telementrymontor").logStatusData(data);',
      '});',
      '  document.getElementById("telementrymontor").define = function(name,callback){',
      'window.opener.cockpit.rov.emit("telemetry.getDefinition",name,callback);',
      '        };'
    ].join("\n");

    res.render('../ui-plugins/new-ui/public/popup.ejs',
      {
        title: 'Telemetry',
        uiElement: 'telemetry-monitor',
        uiId: 'telementrymontor',
        webComponent: '../plugin/telemetry/webcomponents/telemetry-monitor.html',
        scriptBlock: scriptBlock
      });
  });

  deps.app.get('/new-ui/serial-monitor', function(req, res) {
    res.render('../ui-plugins/new-ui/public/popup.ejs',
      {
        title: 'Serial Monitor',
        uiElement: 'serial-monitor',
        webComponent: '/webcomponents/serial-monitor.html'
      });
  });
}
module.exports = newUi;
