function lm(name, deps) {
  console.log('This is where the local mededia plugin code would execute in the node process.');
}

module.exports = function (name, deps) {
  return new lm(name,deps);
};
