function minimaltheme(name, deps) {
  console.log('Minimal UI plugin loaded.');
  this.plugin = {
    name: 'minimaltheme',
    type: 'theme'
  };
}
module.exports = function (name, deps) {
  return new minimaltheme(name, deps);
};