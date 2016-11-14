(function()
{
	class InputConfigurator
	{
		constructor(name, deps)
		{
			console.log("InputConfigurator plugin loaded");

			this.globalBus  = deps.globalEventLoop;
            this.cockpitBus = deps.cockpit;

			var self = this;

			this.listeners = {};	
		}

		start()
		{
			//Start funciton for the node side of this plugin

		}

		stop()
		{
			//Stop functino for the node side of this plugin

		}

		getSettingSchema()
		{
			//From http://json-schema.org/examples.html
			return [{
				'title': 'Input Configurator',
				'type': 'object',
				'id': 'inputConfigurator',
				'properties': {
					'presets': {
						'type': 'array'
					}
				}
			}];
		}
	}

	module.exports = function(name, deps)
	{
		return new InputConfigurator(name, deps);
	};

	
}());

// (function()
// {
// 	const Listener = require( 'Listener' );
// 	const fs = require('fs');

// 	class InputConfigurator
// 	{
// 		constructor(name, deps)
// 		{
// 			console.log( 'InputConfigurator plugin loaded' );

// 			this.globalBus  = deps.globalEventLoop;
//             this.cockpitBus = deps.cockpit;

// 			this.settings = {};

// 			var self = this;
		
// 			this.listeners =
// 			{
// 				loadPreset: new Listener(this.cockpitBus, 'plugin.inputConfigurator.loadPreset', false, function(presetNameIn)
// 				{
// 					console.log("Input Configurator: Request to load", presetNameIn, "preset");
// 					self.loadPreset(presetNameIn);
// 				}),

// 				savePreset: new Listener(this.cockpitBus, 'plugin.inputConfigurator.savePreset', false, function(presetIn)
// 				{
// 					console.log("Input Configurator: Got preset");
// 					self.savePresetToFile(presetIn);
// 				}),

// 				settings: new Listener( this.globalBus, 'settings-change.inputConfigurator', true, function(settings) 
// 				{
// 					console.log("InputConfigurator: Got new settings");

// 					//Apply the settings
// 					self.settings = settings.inputConfigurator;
// 					console.log(self.settings);



// 				})
// 			}
// 		}

// 		savePresetToFile(presetIn)
// 		{
// 			var self = this;

// 			console.log("Input Configurator: Saving preset");
// 			fs.writeFile('/tmp/presets/data.json', JSON.stringify(presetIn, null, 2) , 'utf-8');
// 		}


// 		loadPreset(presetName)
// 		{
// 			var self = this;
			
// 			console.log("Input Configurator: Loading preset");
// 			var presetOut = JSON.parse(fs.readFileSync('/tmp/presets/data.json', 'utf8'));
// 			self.cockpitBus.emit('plugin.inputConfigurator.loadedPreset', presetOut);
// 		}

// 		start()
// 		{
// 			console.log("Starting InputConfigurator");
// 			this.listeners.loadPreset.enable();
// 			this.listeners.savePreset.enable();
// 			this.listeners.settings.enable();
// 		}

// 		stop()
// 		{
		
// 			this.listeners.savePreset.disable();
// 			this.listeners.settings.disable();
// 		}

// 		getSettingSchema()
// 		{
// 			console.log("InputConfigurator: Getting Setting schema");

// 			return [{
// 				'title': 'Input Configurator',
// 				'type': 'object',
// 				'id': 'inputConfigurator',
// 				'presets': {
// 					'dummydum': {
// 						'type': 'number',
// 						'default': 45.0
// 					},
// 					'inverted': {
//                     'type': 'boolean',
//                     'format': 'checkbox',
//                     'default': false
//                     },
// 				}
// 			}];

// 		}

// 	}

// 	module.exports = function(name, deps) 
//     {
//         return new InputConfigurator(name, deps);
//     };

// }());