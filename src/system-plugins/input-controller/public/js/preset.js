(function () 
{  
    //Necessary for debug utils
    var log;
    var trace;
    var log_debug;

    $.getScript('components/visionmedia-debug/dist/debug.js', function() {
        log = debug('input-controller:log');
        trace = debug('input-controller:trace');
        log_debug = debug('input-controller:debug');
    });

    'use strict';
    class Preset
    {
        constructor(presetName)
        {
            if(presetName == null)
            {
                trace("Tried to create a null preset!");
                return;
            }
            
            var self = this;            
            self.name = presetName;

            //The actions this preset will hold
            self.actions = new Map();
        };

        addAction(actionIn)
        {
            if(actionIn == null)
            {
                log_debug("Tried to add a null action");
                return;
            }

            var self = this;

            //Check to see if this controller exists
            if(self.actions.has(actionIn))
            {
                return;
            }

            //Set this action (string) to an empty array (for inputs)
            self.actions.set(actionIn, new Map());
        };


        registerInput(actionIn, inputIn)
        {
            var self = this;

            if(inputIn == null)
            {
                console.error("Undefined input trying to register with preset");
                return;
            }

            //Make sure the associated controller exists
            if(!self.actions.has(actionIn))
            {
                console.error("Tried to add an input with an unregistered action: ", inputIn);
                return;
            }

            //Create a handle to the input type for this controller we will be adding an input to
            var action = self.actions.get(actionIn);

            action.set(inputIn.controller, inputIn);
        };

        updateInput(actionIn, inputIn)
        {
            var self = this;

            //If this input exists update it
            var action = self.actions.get(actionIn);
            action.set(inputIn.controller, inputIn);
        };
        
        unregisterInput(actionIn, inputIn)
        {
            var self = this;

            var action = self.actions.get(actionIn);
            action.delete(inputIn.controller); 
        };
    };

    var systemPlugins = namespace('systemPlugin');
    systemPlugins.inputController.Preset = Preset;

})();