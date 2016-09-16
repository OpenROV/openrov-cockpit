function BlackBox(name, deps) {
  console.log('This is where blackbox plugin code would execute in the node process.');
  deps.app.get('/sw.js', function (req, res) {
    var data = 'if(\'function\' === typeof importScripts) {importScripts(\'plugin/blackbox/js/lib/sw.js\');}';
    res.writeHead(200, {
      'Content-Type': 'application/javascript',
      'Content-Length': data.length
    });
    res.write(data);
    res.end();
  });
}
module.exports = function (name, deps) {
  return new BlackBox(name, deps);
};