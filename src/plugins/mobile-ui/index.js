function mobileUi(name, deps) {
  deps.logger.debug('Mobile UI plugin loaded.');
  this.plugin = {
    name: 'mobile-ui',
    type: 'theme'
  };
}
module.exports = function (name, deps) {
  return new mobileUi(name, deps);
};