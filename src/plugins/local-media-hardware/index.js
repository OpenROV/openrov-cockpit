function lm(name, deps) {
  deps.logger.debug('This is where the local mededia plugin code would execute in the node process.');
}
module.exports = function (name, deps) {
  return new lm(name, deps);
};