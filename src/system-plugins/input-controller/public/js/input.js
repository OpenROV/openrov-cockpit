// (function()
// {
//     'use strict';
//     class Input
//     {
//         constructor(input)
//         {
//             if(input == null)
//             {
//                 console.error("Tried to create a null input");
//                 return;
//             }

//             var self = this;
//             console.log("Creating a new input:", input.name);
            
//             //Populate with details
//             self.name = input.name;
//             self.description = input.description;

//             //Populate the bindings
//             self.bindings = [];
//             input.bindings.forEach(function(binding) {
//                 self.bindings.push(binding);
//             });

//         };
//     };

//     var systemPlugins = namespace('systemPlugin');
//     systemPlugins.inputController.Input = Input;
// })();