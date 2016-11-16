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
			//Stop function for the node side of this plugin
		}

		getSettingSchema()
		{
			//From http://json-schema.org/examples.html
			return [{
				'title': 'Input Configurator',
				'type': 'object',
				'id': 'inputConfigurator',
				'properties': {
					'extraOptions': {
						type: 'object',
						default: {
							'rovPilot': {
								type: 'object',
								default: {
									'exponentialSticks': {
										type: 'boolean',
										default: 'false'
									},
									'invertLeft': {
										type: 'boolean',
										default: 'false'
									},
									'invertRight': {
										type: 'boolean',
										default: 'false'
									}
								}
							}
						}
					},
					'lastPreset': {
						type: 'string',
						default: 'undefined'
					},
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
