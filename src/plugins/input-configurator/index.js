(function()
{
	class InputConfigurator
	{
		constructor(name, deps)
		{

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
				"title": "Input Configurator",
				"type": "object",
				"properties": {
					"extraOptions": {
						"type": "object",
						"exponentialRate": {
							"type": "number"
						},
						"exponentialSticks": {
							"type": "boolean",
							"default": "false"
						},
						"inversions": {
							"LEFT_STICK_X": {
								"type": "boolean",
								"default": "false"									
							},
							"LEFT_STICK_Y": {
								"type": "boolean",
								"default": "false"									
							}, 
							"RIGHT_STICK_X": {
								"type": "boolean",
								"default": "false"									
							},
							"RIGHT_STICK_Y": {
								"type": "boolean",
								"default": "false"									
							}
						}
					},
					"lastPreset": {
						"type": "string",
						"default": "undefined"
					},
					"presets": {
						"type": "array"
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
