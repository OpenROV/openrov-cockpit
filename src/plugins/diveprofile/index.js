function example(name, deps) {
  console.log('This is where DiveProfile plugin.');

  deps.cockpit.on('plugin.diveprofile.watertype.toggle', function () {
    deps.rov.send('dtwa()');
  });
    
  deps.rov.on('status', function(data) {
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
      deps.cockpit.emit('plugin.diveprofile.watertype', watertype);
      deps.config.preferences.set('water_type', watertype.raw );
    }
  });
}
module.exports = example;