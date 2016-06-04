function engineeringPanel(name, deps) {
	console.log('This is where the engineering panel plugin code would execute in the node process.');

	//instance variables
	this.deps = deps; //hold a reference to the plugin dependencies if you are going to use them
	this.globalEventLoop = deps.globalEventLoop; //explicitlly calling out the rov eventemitter
	this.cockpit = deps.cockpit; //explicitly calling out cockpit eventemitter
	this.statusdata = {};
}

// Start is executed after all plugins have loaded. Activate listeners here.
engineeringPanel.prototype.start = function start(){
  var self = this; 

	self.deps.globalEventLoop.on( 'physicalInterface.status', function(data){
	    for (var i in data) {
			if (i === 'cmd'){
				if (data[i].indexOf('ping')>=0) continue;
			}
			self.statusdata[i] = data[i];
		}
		self.deps.cockpit.emit('plugin.engineering.data', self.statusdata);
	});

}

module.exports = function (name, deps) {
  return new engineeringPanel(name,deps);
};
