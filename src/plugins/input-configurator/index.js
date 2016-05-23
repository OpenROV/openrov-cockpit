function inputConfigurator(name, deps) {
  console.log('This is the input configurator.');
}
module.exports = function(name,deps){
  return new inputConfigurator(name,deps);
};