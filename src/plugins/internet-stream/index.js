var is = function is(name, deps) {
  console.log('This is where the internet streaming plugin code would execute in the node process.');
}

module.exports = function (name, deps) {
  return new is(name,deps);
};
