function video(name, deps) {
  console.log('This is where the video plugin code would execute in the node process.');

  //instance variables
  this.deps = deps; //hold a reference to the plugin dependencies if you are going to use them
  this.rov = deps.rov; //explicitlly calling out the rov eventemitter
  this.cockpit = deps.cockpit; //explicitly calling out cockpit eventemitter
  var self=this;
  this.deps.globalEventLoop.on('CameraRegistration',function(data){
    // console.log("Re-emitting CameraRegistration");
  	self.cockpit.emit('CameraRegistration',data);
  });
  this.cameras={};

  function AddCamera(camera){
    if (self.cameras[camera.path] == undefined){
      self.cameras[camera.path]=[];
    }
    self.cameras[camera.path].push(camera);
  }

  this.deps.globalEventLoop.on('video-deviceRegistration',function(data){
    if (typeof(data) == 'array'){
      data.forEach(function(camera){
        AddCamera(camera);
      })
    }else{
      AddCamera(data);
    }
  });

}

// Start is executed after all plugins have loaded. Activate listeners here.
video.prototype.start = function start(){
  var self = this; //set closure state variable for use in functions

  //enumerate video devices


}

// This is all that is required to enable settings for a plugin. They are
// automatically made editable, saved, etc from this definition.
video.prototype.getSettingSchema = function getSettingSchema(){
//from http://json-schema.org/videos.html

  var cameraIDs = [];

  //This should keep the CamerIDs list up to date in the schema
  //TODO: Test, we are probabaly caching all of this so that we
  //may need to support syncronous timing of some sort here.
  this.deps.globalEventLoop.on('video-deviceRegistration',function(data){
    if (typeof(data) == 'array'){
      cameraIDs=cameraIDs.concat(data);
    }else{
      cameraIDs.push(data.deviceid);
    }
  });

  return [{
	"title": "Video Settings",
	"id" :"videosettings",
  "type" : "object",
  "properties": {
    "cameras":{
    "id": "cameras",
    "type": "array",
    "items": {
      "id": "0",
    	"type": "object",
    	"properties": {
    		"cameraID": {
    			"type": "string",
          "enum" : ['TBD']
    		},
    		"location": {
    			"type": "string",
          "default" : "forward"
    		}
    	}
    }
   }
  }
}];
};

module.exports = function (name, deps) {
  return new video(name,deps);
};
