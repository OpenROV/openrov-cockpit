function cockpit(name, deps) {
  console.log('This is where cockpit-applet plugin code would execute in the node process.');

}
module.exports = function (name, deps) {
  return new cockpit(name, deps);
};