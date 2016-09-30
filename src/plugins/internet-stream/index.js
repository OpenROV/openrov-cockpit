var is = function is(name, deps) {
  console.log('This is where the internet streaming plugin code would execute in the node process.');
};
is.prototype.getSettingSchema = function getSettingSchema() {
  //from http://json-schema.org/examples.html
  return [{
      'title': 'Live Streaming',
      'category': 'cloud',
      'type': 'object',
      'id': 'internetstreaming',
      'properties': {
        'streamingServerURI': {
          'title' : 'Streaming Server Address',
          'description' : '*DEBUG SETTING* This will be removed soon',
          'type': 'string',
          'default': 'http://192.168.99.100:3030'
        },
        'testmode': {
          'title': 'Simulate Only',
          'description' : 'Audio and video will be sent to the OpenROV cloud services, but they will not be forwarded to the final live streaming services.',
          'type': 'boolean',
          'format': 'checkbox',
          'default': true
        }
      }
    }];
};
module.exports = function (name, deps) {
  return new is(name, deps);
};