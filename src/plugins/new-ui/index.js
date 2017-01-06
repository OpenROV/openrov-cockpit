function newUi(name, deps) {
  deps.logger.debug('New UI plugin loaded.');
  this.plugin = {
    name: 'new-ui',
    type: 'theme'
  };
}
module.exports = function (name, deps) {
  return new newUi(name, deps);
};