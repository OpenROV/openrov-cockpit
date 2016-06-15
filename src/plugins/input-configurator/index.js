function inputConfigurator(name, deps) {
  console.log('This is the input configurator.');
};

// This is all that is required to enable settings for a plugin. They are
// automatically made editable, saved, etc from this definition.
inputConfigurator.prototype.getSettingSchema = function getSettingSchema(){
//from http://json-schema.org/examples.html

		var mapSchema = {
						"type": "array",
						"uniqueItems": false,
						"items": {
							"type": "object",
							"default": null,
							"properties": {
								"name": {
									"type": "string"
								},
								"default": {
									"type" : "boolean",
									"default": false
								},
								"bindings": {
									"type": "array",
									"uniqueItems": false,
									"default": null,
									"items": {
										"type": "object",
										"properties": {
											"name": {
												"type": "string"
											},
											"binding": {
												"type": "string"
											}
										},
										"required": [
											"name",
											"binding"
										]
									}
								}
							},
							"required": [
								"name",
								"bindings"
							]
						}
					};
		
		return [
			{
				"title": "Input Configurator Schema",
				"id": "inputConfigurator", //Added to support namespacing configurations
				"type": "object",
				"properties": {
					"currentMap": mapSchema,
					"maps": {
						"type": "array",
						"uniqueItems": false,
						"items": {
							"type": "object",
							"default": null,
							"properties": {
								"name": {
									"type": "string"
								},
								"map": mapSchema
							},
							"required": [
								"name",
								"map"
							]
						}
					}
				},
				"required": [
					"currentMap",
					"maps"
				]
			}			
		]

// 	var mapSchema = {
// 			"type": "array",
// 			"items": {
// 				"type": "object",
// 				"properties": {
// 					"name": { 
// 						"type": "string",
// 					},
// 					"bindings": {
// 						"type": "array",
// 						"items": {
// 							"type": "object",
// 							"properties": {
// 								"type": "string",
// 								"binding": "string"
// 							},
// 							"required": [ "type", "binding" ]
// 						}
// 					}
// 				},
// 				"required": [ "name" ]	
// 			}
// 		};

//   return [{
// 	"title": "Input Configurator Schema",
//   "id": "inputConfigurator", //Added to support namespacing configurations
// 	"type": "object",
// 	"properties": {
// 		"currentMap": mapSchema,
// 		"availableMaps": {
// 			"type": "array",
// 			"items": {
// 				"type": "object",
// 				"properties": {
// 					"name": {
// 						"type": {}
// 					}
// 				}
// 			}
// 		} 
// 	}
// }];
};

// Start is executed after all plugins have loaded. Activate listeners here.
inputConfigurator.prototype.start = function start(){
  var self = this; //set closure state variable for use in functions

}


module.exports = function(name,deps){
  return new inputConfigurator(name,deps);
};