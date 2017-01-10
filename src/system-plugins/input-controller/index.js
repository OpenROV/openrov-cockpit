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

      var self = this;


      this.listeners = 
      {
        requestCustomPresets: new Listener(this.cockpitBus, 'plugin.inputController.requestCustomPresets', true, function(data)
        {
          self.searchForExistingPresets(presetDirectory);
        })
      }

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
      this.listeners.requestCustomPresets.enable();

      this.searchForExistingPresets( presetDirectory );
    }

    stop()
    {
      this.listeners.requestCustomPresets.disable();
    }

  }

  module.exports = function(name, deps)
  {
    return new InputController(name, deps);
  };


}());

