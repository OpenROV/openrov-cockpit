(function()
{
	const Listener = require( 'Listener' );
	const fs = require('fs');

	class InputConfigurator
	{
		constructor(name, deps)
		{
			console.log( 'InputConfigurator plugin loaded' );

			this.globalBus  = deps.globalEventLoop;
            this.cockpitBus = deps.cockpit;

			var self = this;
		
			this.listeners =
			{
				loadPreset: new Listener(this.cockpitBus, 'plugin.inputConfigurator.loadPreset', false, function(presetNameIn)
				{
					console.log("Input Configurator: Request to load", presetNameIn, "preset");
					self.loadPreset(presetNameIn);
				}),

				savePreset: new Listener(this.cockpitBus, 'plugin.inputConfigurator.savePreset', false, function(presetIn)
				{
					console.log("Input Configurator: Got preset");
					self.savePresetToFile(presetIn);
				})
			}
		}

		savePresetToFile(presetIn)
		{
			var self = this;

			console.log("Input Configurator: Saving preset");
			console.log(presetIn.name);

			var presetFilePath = '/tmp/presets/' + presetIn.name + "_preset.json";

			fs.writeFile(presetFilePath, JSON.stringify(presetIn, null, 2) , 'utf-8');
		}


		loadPreset(presetName)
		{
			var self = this;
			
			console.log("Input Configurator: Loading preset");

			var presetFilePath = '/tmp/presets/' + presetName + "_preset.json";

			var presetOut = JSON.parse(fs.readFileSync(presetFilePath, 'utf8'));
			self.cockpitBus.emit('plugin.inputConfigurator.loadedPreset', presetOut);
		}

		start()
		{
			console.log("Starting InputConfigurator");
			this.listeners.loadPreset.enable();
			this.listeners.savePreset.enable();
		}

		stop()
		{
			this.listeners.savePreset.disable();
		}
	}

	module.exports = function(name, deps) 
    {
        return new InputConfigurator(name, deps);
    };

}());