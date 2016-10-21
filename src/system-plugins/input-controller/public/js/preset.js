(function () 
{
    'use strict';
    class Preset
    {
        constructor(presetName)
        {
            if(presetName == null)
            {
                console.error("Tried to create a null preset!");
                return;
            }
            
            var self = this;
            console.log("Creating a new preset:", presetName);
            
            self.name = presetName;

            //Initialize the controller handle
            //This is where users can add a controller handle
            self.controllers = [];
        };

        //Preset Member functions
        addController(controllerName)
        {
            //Make sure we got a valid controller
            if(controllerName == null)
            {
                console.error("Tried to add a null controller to preset:", this.name);
                return;
            }

            //Make sure it doesn't already exist in our list
            if(controllerExists(this.controllers, controllerName))
            {
                console.error("Controller:", controllerName, "already exists in preset:", this.name,"Delete or update that controller instead of adding it")
                return;
            }

            console.log("Adding controller:", controllerName, "to preset:", this.name);
            //Adds a controller to the array of avaiable controllers to bind 
            var controller = 
            {
                name: controllerName,
                bindings: new Map()
            }

            //Add to our existing list
            this.controllers.push(controller);
        };

        removeController(controllerName)
        {
            //Make sure we got a valid controller
            if(controllerName == null)
            {
                console.error("Tried to remove a null controller to preset:", this.name);
                return;
            }

            //Remove the controller from the list
            //TODO: Surely there is a more idiomatic way
            var result = getIndex(this.controllers, controllerName);
            if(result.success)
            {
                this.controllers.splice([result.index], 1);
            }
            else
            {
                console.log("Could not find controller:", controllerName, "in preset:", this.name);
                return;
            }
        };
    };

    //Private helper functions
    function controllerExists(controllers, key)
    {
        return controllers.some( function(controller) {
            return key == controller.name;
        });
    };

    function getIndex(array, key)
    {
        var index;
        for(var i = 0; i < array.length; ++i)
        {
            if(array[i].name == key)
            {
                return {
                    success: true,
                    index: i
                }
            }
        }
        return {
            success: false,
            index: null
        }
    };

    var systemPlugins = namespace('systemPlugin');
    systemPlugins.InputController.Preset = Preset;

})();