function basictheme(name, deps) {
  console.log('Basic UI plugin loaded.');
  this.plugin = {
    name: 'basictheme',
    type: 'theme'
  };
}
module.exports = function (name, deps) {
  return new basictheme(name, deps);
};