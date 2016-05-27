var is = function is(name, deps) {
  console.log('This is where the internet streaming plugin code would execute in the node process.');
}

is.prototype.getSettingSchema = function getSettingSchema(){
//from http://json-schema.org/examples.html
  return [{
	"title": "Internet Streaming Plugin",
	"type": "object",
  "id": "internetstreaming", //Added to support namespacing configurations
	"properties": {
		"streamingServerURI": {
			"type": "string",
      "default" : "http://192.168.99.100:3030" //Added default
		},
		"testmode": {"type":"boolean", "format": "checkbox","default":true}
	}
}];
};

module.exports = function (name, deps) {
  return new is(name,deps);
};
