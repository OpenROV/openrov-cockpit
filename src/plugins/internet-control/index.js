function ic(name, deps) {
  console.log('This is where the internet control plugin code would execute in the node process.');

  //instance variables
  this.deps = deps; //hold a reference to the plugin dependencies if you are going to use them
  this.rov = deps.rov; //explicitlly calling out the rov eventemitter
  this.cockpit = deps.cockpit; //explicitly calling out cockpit eventemitter


}

// Start is executed after all plugins have loaded. Activate listeners here.
ic.prototype.start = function start(){
  var self = this; //set closure state variable for use in functions

}

// This is all that is required to enable settings for a plugin. They are
// automatically made editable, saved, etc from this definition.
ic.prototype.getSettingSchema = function getSettingSchema(){
//from http://json-schema.org/examples.html
  return [{
	"title": "Internet Control Schema",
	"type": "object",
  "id": "ic", //Added to support namespacing configurations
	"properties": {
		"webRTCSignalServerURI": {
			"type": "string",
      "default" : "http://192.168.99.100:8080" //Added default
		},
		"secretKey": {
			"type": "string",
      "default" : "OpenROV" //Added default
		}
	}
}];
};

module.exports = function (name, deps) {
  return new ic(name,deps);
};
