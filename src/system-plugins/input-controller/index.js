(function()
{
  const fs = require('fs');
  const Listener = require('Listener');

  //Where the presets are located
  const presetDirectory = './src/static/presets/';

  class InputController
  {
    constructor(name, deps)
    {
      deps.logger.debug('InputController plugin loaded');

      this.globalBus = deps.globalEventLoop;
      this.cockpitBus = deps.cockpit;

      this.presetPaths = [];
    }

    searchForExistingPresets( directoryIn )
    {
      var self = this;

      fs.readdir(directoryIn, (err, files) => {
        files.forEach(file => {
          var filePath = directoryIn + file;
          self.presetPaths.push(filePath);
        });

        //Send to the client
        var presetAccu = [];
        for(var i = 0; i < self.presetPaths.length; ++i)
        {
          var presetObj = JSON.parse(fs.readFileSync(self.presetPaths[i]), 'utf8');
          presetAccu.push(presetObj);
        }
        self.cockpitBus.emit('plugin.inputConfigurator.existingPresets', presetAccu);

        presetAccu = [];
        self.presetPaths = [];
      })

    }

    start()
    {      
      this.searchForExistingPresets( presetDirectory );
    }

    stop()
    {
    }

  }

  module.exports = function(name, deps)
  {
    return new InputController(name, deps);
  };


}());

