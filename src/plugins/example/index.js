function example(name, deps) {
  console.log('This is where the example plugin code would execute in the node process.');

  //instance variables
  this.deps = deps; //hold a reference to the plugin dependencies if you are going to use them
  this.rov = deps.rov; //explicitlly calling out the rov eventemitter
  this.cockpit = deps.cockpit; //explicitly calling out cockpit eventemitter


}

// Start is executed after all plugins have loaded. Activate listeners here.
example.prototype.start = function start(){
  var self = this; //set closure state variable for use in functions

  //Listens for a message from the browser cockpit and emits a response to anyone listening
  this.cockpit.on('plugin.example.foo', function() {
    self.cockpit.emit('plugin.example.message', 'bar');
  });

  //Listens for a message from the browser cockpit and uses the request/response
  //pattern to reply using a function callback
  this.cockpit.on('plugin.example.foo-private', function(callback) {
    callback('bar-private');
  });

  //For messages that are destined for the MCU, a helper function to simply
  //wire the browser cockpit messages directly to and from the MCU.
  this.rov.registerPassthrough({
    messagePrefix: 'plugin.example',
    fromROV: [
      'example_foo',
      'example_bar'
    ],
    toROV: [
      'example_to_foo',
      'example_to_bar'
    ]
  });

}

// This is all that is required to enable settings for a plugin. They are
// automatically made editable, saved, etc from this definition.
example.prototype.getSettingSchema = function getSettingSchema(){
//from http://json-schema.org/examples.html
  return [{
	"title": "Example Schema",
	"type": "object",
  "id": "example", //Added to support namespacing configurations
	"properties": {
		"firstName": {
			"type": "string",
      "default" : "Open" //Added default
		},
		"lastName": {
			"type": "string",
      "default" : "Rov" //Added default
		},
		"age": {
			"description": "Age in years",
			"type": "integer",
			"minimum": 0
		}
	},
	"required": ["firstName", "lastName"]
}];
};

module.exports = function (name, deps) {
  return new example(name,deps);
};
