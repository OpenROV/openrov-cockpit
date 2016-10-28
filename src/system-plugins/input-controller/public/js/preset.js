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

            //The inputs this preset will hold
            //Represented as ["inputName"]:{name, description, bindings}
            self.inputs = new Map();
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

        makeCopy(presetName)
        {
            var self = this;
            var presetOut;

            presetOut = new inputController.Preset(presetName);
            presetOut.controllers = self.controllers;
            return presetOut;
        }

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
        }
    };

    var systemPlugins = namespace('systemPlugin');
    systemPlugins.inputController.Preset = Preset;

})();