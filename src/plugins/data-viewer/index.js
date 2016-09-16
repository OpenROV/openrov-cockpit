function DataViewer(name, deps) {
  console.log('This is where DataViewer plugin code would execute in the node process.');
  deps.app.get('/data', function (req, res) {
    var view = __filename.substring(0, __filename.lastIndexOf('/')) + '/' + 'index.ejs';
    var pathInfo = deps.pathInfo();
    res.render(view, {
      title: 'OpenROV Cockpit DataViewer',
      scripts: pathInfo.scripts,
      styles: pathInfo.styles,
      sysscripts: pathInfo.sysscripts,
      config: deps.config
    });
  });
}
module.exports = function (name, deps) {
  return new DataViewer(name, deps);
};