function video(name, deps) {
  console.log('This is where the video plugin code would execute in the node process.');

  //instance variables
  this.deps = deps; //hold a reference to the plugin dependencies if you are going to use them
  this.rov = deps.rov; //explicitlly calling out the rov eventemitter
  this.cockpit = deps.cockpit; //explicitly calling out cockpit eventemitter


}

// Start is executed after all plugins have loaded. Activate listeners here.
video.prototype.start = function start(){
  var self = this; //set closure state variable for use in functions
//      self.rov.emit('CameraRegistration',{cameraLocation:'front', videoMimeType:'video/mp4', resolution:'1920x1080', framerate:30, sourcePort:service.port, sourceAddress:service.address});

  this.deps.rov.on('CameraRegistration',function(data){
  	self.cockpit.emit('CameraRegistration',data);
  });
}

// This is all that is required to enable settings for a plugin. They are
// automatically made editable, saved, etc from this definition.
video.prototype.getSettingSchema = function getSettingSchema(){
//from http://json-schema.org/videos.html
  return [{
	"title": "Video Settings",
	"type": "object",
  "id": "video", //Added to support namespacing configurations
	"properties": {
		"forward_camera_url": {
			"type": "string",
      "default" : "/rov/forward-camera" //Added default
		},
		"framerate": {
			"type": "number",
      "default" : "30" //Added default
		},
		"resolution": {
			"type": "string",
			"default": "1280x720",
      "enum": ["1920x1080","1600x900","1360x768","1280x720","1024x768","800x600"]
		}
	}
}];
};

module.exports = function (name, deps) {
  return new video(name,deps);
};
