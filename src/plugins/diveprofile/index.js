function diveprofile(name, deps) {
  console.log('This is where DiveProfile plugin.');

  //instance variables
  this.rov = deps.rov;
  this.cockpit = deps.cockpit;
  this.global = deps.globalEventLoop;
  this.deps = deps;


}

diveprofile.prototype.start = function start(){
  var self=this;

  this.deps.rov.on('status', function(data) {
    var watertype = undefined;
    if ('dtwa' in data) {
      watertype = {raw: data.dtwa, watertype: data.dtwa.toString() == '1' ? 'salt' : 'fresh' };
    }
    if ('settings' in data) {
      if (data.settings.water_type) {
        watertype = {raw: data.settings.water_type, watertype: data.settings.water_type.toString() == '1' ? 'salt' : 'fresh' };
      }
    }
    if (watertype !== undefined) {
      self.deps.cockpit.emit('plugin.diveprofile.watertype', watertype);
      self.deps.config.preferences.set('plugin:diveprofile:water_type', watertype);
    }
  });

  this.deps.cockpit.on('plugin.diveprofile.watertype.toggle', function () {
    self.deps.rov.send('dtwa()');
  });

  self.global.withHistory.on('settings-change.diveprofile',function(data){
    var settings = data.diveprofile;
    //TODO: Replumb the arduino APIs to explicilty set the water type
    //settings.['water-type']
  })
}

diveprofile.prototype.getSettingSchema = function getSettingSchema(){
  return [
    {
        "title": "Dive Profile",
        "id" : "diveprofile",
        "type": "object",
        "properties": {
            "water-type": {
                "type": "string",
                "enum": ["salt","fresh"],
                "title": "Water type",
                "default": "fresh"
            }
        }
    }
  ]
}
module.exports = function(name,deps){
  return new diveprofile(name,deps);
}
