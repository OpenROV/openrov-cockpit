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
                buttons: new Map(),
                axes: new Map()
            };

            self.controllers.set(controllerIn, value);
        };

        addAction(action)
        {
            console.log("GOT ACTION:", action);
        };

        addInput(input)
        {
            var self = this;

            //Make sure we got a valid input
            if(input == null)
            {
                console.error("Tried to add an undefined input to preset:", self.name);
                return;
            }
            
            //Check to see if this input exists
            if(self.inputs.has(input.name))
            {
                console.log("Already have a registration for:", input.name, "with preset:", self.name);
                return;
            }
            else
            {
                //If it doesn't exist on our map, add it!
                self.inputs.set(input.name, input);
            }           
        };

        removeInput(input)
        {
            var self = this;

            //Make sure this is valid
            if(input == null)
            {
                console.error("Tried to remove an undefined input from preset:", self.name);
                return;
            }

            console.log("Removing input:", input.name, "from preset:", self.name);
            self.inputs.delete(input.name);
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

            //If this input exists update it
            if(self.inputs.has(input.name))
            {
                //Set this binding to undefined
                var unregisteredInput = self.inputs.get(input.name);
                unregisteredInput.controllers.delete(input.controller);
            }
            else
            {
                console.error("Tried to unregister an input that doesn't exist with this preset.");
                return;
            }
        };
    };

    var systemPlugins = namespace('systemPlugin');
    systemPlugins.inputController.Preset = Preset;

})();