function HostDiagnostics(name, deps) {
  console.log('This is where HostDiagnostics plugin code would execute in the node process.');
}
module.exports = function (name, deps) {
  return new HostDiagnostics(name,deps);
};
