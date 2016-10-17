function RovDefaultApplets(name, deps) {
  console.log('This is where RovDefaultApplets plugin code would execute in the node process.');

}
module.exports = function (name, deps) {
  return new RovDefaultApplets(name, deps);
};