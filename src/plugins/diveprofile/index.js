function example(name, deps) {
  console.log('This is where DiveProfile plugin.');

  deps.cockpit.on('plugin.diveprofile.watertype.toggle', function () {
    deps.rov.send('dtwa()');
  });
    
  deps.rov.on('status', function(data) {
    if ('dtwa' in data) {
      var watertype = data.dtwa.toString() == '1' ? 'salt' : 'fresh';
      deps.cockpit.emit('plugin.diveprofile.watertype', { raw: data.dtwa, watertype: watertype});
    }
    if ('settings' in data) {
      if (data.settings.water_type) {       
        var watertype = data.settings.water_type.toString() == '1' ? 'salt' : 'fresh';
        deps.cockpit.emit('plugin.diveprofile.watertype', { raw: data.dtwa, watertype: watertype});
      }
    }
  });
}
module.exports = example;