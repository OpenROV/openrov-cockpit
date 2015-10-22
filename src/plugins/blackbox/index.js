function BlackBox(name, deps) {
  console.log('This is where blackbox plugin code would execute in the node process.');
}

module.exports = function (name, deps) {
  return new BlackBox(name,deps);
};
