function engineeringPanel(name, deps) {
  console.log('This is where the engineering panel plugin code would execute in the node process.');

  //instance variables
  this.deps = deps; //hold a reference to the plugin dependencies if you are going to use them
  this.globalEventLoop = deps.globalEventLoop; //explicitlly calling out the rov eventemitter
  this.cockpit = deps.cockpit; //explicitly calling out cockpit eventemitter
}

// Start is executed after all plugins have loaded. Activate listeners here.
engineeringPanel.prototype.start = function start(){
  var self = this; //set closure state variable for use in functions
}

module.exports = function (name, deps) {
  return new engineeringPanel(name,deps);
};
