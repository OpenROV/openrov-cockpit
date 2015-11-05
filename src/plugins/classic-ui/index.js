function classicUI(name, deps) {
  console.log('Classic UI loaded.');

  this.plugin={
    name: "classic-ui",
    type: "theme"
  };

}
module.exports = function(name,deps){
  return new classicUI(name,deps);
};
