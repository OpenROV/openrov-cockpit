function TankControl(name, deps) {
  console.log('This is where tankcontrol plugin code would execute in the node process.');
}
module.exports = function (name, deps) {
  return new TankControl(name,deps);
};
