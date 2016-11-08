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

            //The controllers this preset will hold
            self.controllers = new Map();
        };

        addController(controllerIn)
        {
            if(controllerIn == null)
            {
                console.error("Tried to add a null controller");
                return;
            }

            var self = this;

            //Check to see if this controller exists
            if(self.controllers.has(controllerIn))
            {
                return;
            }

            //Init with the default input classes we support. More can be added
            var value = {
                button: new Map(),
                axis: new Map()
            };

            self.controllers.set(controllerIn, value);
        };


        registerInput(input)
        {
            var self = this;

            if(input == null)
            {
                console.error("Undefined input trying to register with preset");
                return;
            }

            //Make sure the associated controller exists
            if(!self.controllers.has(input.controller))
            {
                console.error("Tried to add an input with an unregistered controller: ", input);
                return;
            }

            var controller = self.controllers.get(input.controller);

            //Create a handle to the input type for this controller we will be adding an input to
            var inputMap = controller[input.type];
            inputMap.set(input.name, input.action);
        };

        updateInput(input)
        {
            var self = this;

            //If this input exists update it
            if(self.inputs.has(input.name))
            {
                //Grab the input
                var existingInput = self.inputs.get(input.name);

                //Update the controller
                existingInput.controllers.set(input.controller, input.input);
            }
            else
            {
                console.log("Tried to update an input that doesn't exist with this preset. Adding it");
                self.addInput(input);
            }
        };
        
        unregisterInput(input)
        {
            var self = this;

            var controller = self.controllers.get(input.controller);
            var inputType = input.type;

            //Delete it
            controller[inputType].delete(input.name);    
        };
    };

    var systemPlugins = namespace('systemPlugin');
    systemPlugins.inputController.Preset = Preset;

})();