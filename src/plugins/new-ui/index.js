function newUi(name, deps) {
  console.log('New UI plugin loaded.');

  this.plugin={
    name: "new-ui",
    type: "theme",
  };

  deps.app.get('/new-ui/telemetry', function(req, res) {
    var scriptBlock = [
      '  document.getElementById("telementrymontor").define = function(name,callback){',
      'window.opener.cockpit.emit("telemetry.getDefinition",name,callback);',
      '        };'
    ].join("\n");

    res.render(__filename.substring(0, __filename.lastIndexOf("/")) + '/popup.ejs',
      {
        title: 'Telemetry',
        uiElement: 'orov-telemetry-monitor',
        uiId: 'telementrymontor',
        webComponent: '../components/telemetry/orov-telemetry-monitor.html',
        scriptBlock: scriptBlock
      });
  });

  deps.app.get('/new-ui/serial-monitor', function(req, res) {
    res.render(__filename.substring(0, __filename.lastIndexOf("/")) + '/popup.ejs',
      {
        title: 'Serial Monitor',
        uiElement: 'orov-serial-monitor',
        uiId: 'serialMonitor',
        webComponent: '../components/serial-monitor/orov-serial-monitor.html',
        scriptBlock: ''
      });
  });
}
module.exports = function(name,deps){
  return new newUi(name,deps);
};
