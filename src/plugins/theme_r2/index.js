function theme_r2(name, deps) {
  console.log('This is where theme_r2 plugin code would execute in the node process.');

  this.plugin={
    name: "themes_r2",
    type: "theme"
  };
}
module.exports = function (name, deps) {
  return new theme_r2(name,deps);
};
