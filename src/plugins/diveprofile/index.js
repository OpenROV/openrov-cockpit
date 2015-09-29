function example(name, deps) {
  console.log('This is where DiveProfile plugin code would execute in the node process.');

  deps.cockpit.on('plugin.diveprofile.watertype.toggle', function () {
    deps.rov.send('dtwa()');
  });
    
  deps.rov.on('status', function(data) {
    if ('dtwa' in data) {
      var watertype = data.dtwa.toString() == '1' ? 'salt' : 'fresh';
      deps.cockpit.emit('plugin.diveprofile.watertype', { raw: data.dtwa, watertype: watertype});
    }
  });
}
module.exports = example;