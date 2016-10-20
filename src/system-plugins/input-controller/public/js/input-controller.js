(function (window, document) {
  var inputController = namespace('systemPlugin.inputController');
  inputController.InputController = function (cockpit) {
    var self = this;
    self.cockpit = cockpit;
    
    self.model = { 
      commands: [] 
    };

    self.registeredCommands = {};
    self.registeredControls = {};
    
    // Add our known controllers
    self.controllers = [];
    self.controllers.push(new inputController.Keyboard(cockpit));
    self.controllers.push(new inputController.Gamepad(cockpit));

    self.checkDuplicates = function () {
      console.log("Checking for duplicates");

      var commandBindings = [];
      var duplicateInformation = [];

      //Iterate through our current registered commands and populate a list of current bindings
      for(var command in self.registeredCommands)
      {
        if(command.active)
        {
          for(var binding in command.bindings)
          {
            commandBindings.push({
              value: binding + ':' + command.bindings[binding],
              name: command.name
            });
          }
        }
      }

      //Now, iterate through that binding list and check for duplicates
      commandBindings.forEach(function(binding) {
        commandBindings.forEach(function(checkBinding) {
          if(binding === checkBinding)
          {
            return;
          }
          if(binding.value === checkBinding.value)
          {
            duplicateInformation.push('Command name: \'' + binding.name + '\' Binding: ' + binding.value);
          }
        });
      });

      //If we found duplicates, let everyone know about it
      if(duplicateInformation.length > 0)
      {
        self.cockpit.emit('plugin-input-controller-duplicates', duplicateInformation);
        console.log('Found duplicate commands: \n' + duplicateInformation.join('\n'));
      }
    };

    return self;
  };

  //Helper function to check if an object is undefined
  inputController.InputController.prototype.isUndefined = function(param)
  {
    return(typeof param === "undefined");
  }

  //Interface to internal registration of controls
  inputController.InputController.prototype.register = function(control) 
  {
    //Check to make sure that we got a valid control to register
    if( this.isUndefined(control) )
    {
      console.error("Input Controller was asked to register an undefined control!");
      return;
    }
    
    this._register(control, true);
  };
  
  //Returns a clone of the internal representation of commands
  inputController.InputController.prototype.commands = function()
  {
    return this.model.commands();
  };

  //Listeners
  inputController.InputController.prototype.listen = function listen() 
  {
    var self = this;
    
    //Activate callback
    this.cockpit.on('InputController.activate', function (controls, fn) 
    {
      //Check to make sure that we got a valid control
      if( self.isUndefined(controls) )
      {
        console.error("Input Controller was asked to activate an undefined control!");
        return;
      }

      //Act on this request
      self.acticate(controls);

      //If there is a function attached, call it
      if( !self.isUndefined(fn) )
      {
        fn();
      }
    });

    //Deactivate callback
    this.cockpit.on('InputController.deactivate', function(controls, fn) 
    {
      
      //Check to make sure that we got a valid control
      if( self.isUndefined(controls) )
      {
        console.error("Input Controller was asked to deactivate an undefined control!");
        return;
      }

      //Act on this request
      self.deactivate(controls);

      //If there is a function attached, call it
      if( !self.isUndefined(fn) )
      {
        fn();
      }
    });

    //Get commands callback
    this.cockpit.on('InputController.getCommands', function(fn)
    {
      
      //Check if the function is valid and then act on the request
      if( !self.isUndefined(fn) )
      {
        //Return a clone of the commands
        var commands = self.model.commands.map(function(command) {
          return {
            name: command.name,
            description: command.description,
            bindings: command.bindings,
            defaults: command.defaults
          }
        });

        //Call the attached function
        fn(commands);
      }
      else
      {
        console.error("Input Controller was asked to return a list of commands, but no function was attached to process the commands");
        return;
      }
    });
    
    //Register control callback
    this.cockpit.on('InputController.register', function(controls, fn) 
    {
      //Check to make sure we got a valid controls handle
      if( self.isUndefined(controls) )
      {
        console.error("Input Controller was asked to register an undefined control!");
        return;
      }

      //Act on this request
      self.register(controls);

      //If there is a function attached, call it
      if( !self.isUndefined(fn) )
      {
        fn();
      }

    });

    //Update binding callback
    this.cockpit.on('InputController.updateBinding', function(controls, fn) 
    {
      //Check to make sure we got a valid controls handle
      if( self.isUndefined(controls) )
      {
        console.error("Input Controller was asked to update the binding to an undefined control!");
        return;
      }

      //Act on this request
      self.updateBinding(controls);

      //If there is a function attached, call it
      if( !self.isUndefined(fn) )
      {
        fn();
      }
    });

    //Suspend all callback
    this.cockpit.on('InpitController.suspendAll', function(fn) 
    {
      console.log("Suspending all inputs!");

      self.model.commands.forEach(function(command) 
      {
        self.suspend(command.name);
      });

      //If there is a function attached, call it
      if( !self.isUndefined(fn) )
      {
        fn();
      }
    });

    //Resume all callback
    this.cockpit.on('InpitController.resumeAll', function(fn) 
    {
      console.log("Resuming all inputs");

      //Create a handle to the commands
      var commands = self.model.commands;

      //And clear them out
      self.model.commands.length = 0;

      commands.forEach(function(command) 
      {
        self.resume(command.name);
      });

      //If there is a function attached, call it
      if( !self.isUndefined(fn) )
      {
        fn();
      }
    });

    //Plugin loaded callback
    /* Crawl the plugins looking for those with settings definitions */
    this.cockpit.loadedPlugins.forEach(function(plugin) 
    {

      if( !self.isUndefined(plugin.inputDefaults) ) 
      {
        if (typeof plugin.inputDefaults === "function") 
        {
          //Use the function as registration
          self.register(plugin.inputDefaults());
        } 
        else 
        {
          self.register(plugin.inputDefaults);
        }
      }
      else
      {
        console.log(plugin, "Did not have valid inputDefaults!");
        return;
      }
    });

  };

  //Member register function
  inputController.InputController.prototype._register = function(controlsIn, doCheck) 
  {
    var self = this;
    
    //Check to make sure we got a valid controls handle
    if( self.isUndefined(controlsIn) )
    {
      console.error("Input Controller was asked to register the binding to an undefined control!");
      return;
    }

    //Controls can be a single object or an array, so let's treat it as such
    var controlsToRegister = [].concat(controlsIn);
    controlsToRegister.forEach(function(control) 
    {
      //Check to make sure we got a valid controls handle
      if( self.isUndefined(control) )
      {
        console.error("Input Controller was asked to register an undefined control!");
        return;
      }

      //Create a new command with the control we were passed
      var command = new inputController.Command(control);

      //Update our internal map of commands to reflect the newly registered command
      self.registeredCommands[command.name] = command;
      
      //Also update our internal model of commands
      self.model.commands.push(command);

      //Let the rest of cockpit know that we just registered a command
      self.cockpit.emit('InputController.registeredCommand', command);
      console.log('InputController: Registering control ' + command.name);

      //Iterate through our input controllers (i.e. keyboard and gamepad) and register this command with them
      self.controllers.forEach(function(controller) 
      {
        //If this is an active command
        if(command.active) 
        {
          //Register it with the controller
          controller.register(command);
          for (var property in command.bindings) 
          {
            self.registeredControls[property + ':' + command.bindings[property]] = command;
          }
        }
      });

    });

    self.controlsToRegister = [];

    //If the caller wants to check for duplicates, do it
    if(doCheck) 
    {
      self.checkDuplicates();
    }
  };


  //Member unregister function
  inputController.InputController.prototype.unregister = function(controls) 
  {
    var self = this;
    
    //Check to make sure we got a valid controls handle
    if( self.isUndefined(controls) )
    {
      console.error("Input Controller was asked to unregister an undefined control!");
      return;
    }
    var controlsToRemove = [].concat(controls);

    controlsToRemove.forEach(function (control) 
    {
      //self.registeredCommands[control.name] = undefined;
      for (var property in control.bindings)
      {
        //it is possible that a different control actually owns a particular binding
        if (self.registeredControls[property + ':' + control.bindings[property]] === control)
        {
          delete self.registeredControls[property + ':' + control.bindings[property]];
        }
      }
    });

    self.controllers.forEach(function (controller) {
      controller.reset();
    });

    var commandsToRegister = [];
    for (var command in self.registeredCommands) 
    {
      commandsToRegister.push(self.registeredCommands[command]);
    }

    self.model.commands.length = 0;
    self._register(commandsToRegister, false);
  };

  //Member activation function
  inputController.InputController.prototype.activate = function(controlNames) 
  {
    var self = this;

    //Check to make sure we got a valid controls handle
    if( self.isUndefined(controlNames) )
    {
      console.error("Input Controller was asked to activate an undefined control!");
      return;
    }

    //Controls can be a single object or an array, so let's treat it as such
    var controlsToActivate = [].concat(controlNames);
    controlsToActivate.forEach(function(control) 
    {
      //Get a handle to the command
      var command = self.registeredCommands[control];

      //Clear the replaced field of the command
      command.replaced = [];

      //Check for conflicts?
      for (var property in command.bindings) 
      {
        if (self.registeredControls[property + ':' + command.bindings[property]] !== undefined) 
        {
          console.log('There is a conflict with ' + self.registeredControls[property + ':' + command.bindings[property]].name);
          command.replaced.push(self.registeredControls[property + ':' + command.bindings[property]]);
        }
      }

      //Activate the command
      command.active = true;

      //And register it
      self._register(command, false);
      console.log('activated command ' + command.name);
    });
  };

  //Member deactivate function
  inputController.InputController.prototype.deactivate = function(controlNames) 
  {
    var self = this;

    //Check to make sure we got a valid controls handle
    if( self.isUndefined(controlNames) )
    {
      console.error("Input Controller was asked to deactivate an undefined control!");
      return;
    }

    var controlsToDeactivate = [].concat(controlNames);
    controlsToDeactivate.forEach(function(control) 
    {
      var command = self.registeredCommands[control];

      if(command) 
      {
        command.active = false;
        self.unregister(command);

        command.replaced.forEach(function(oldcommand)
        {
          self._register(oldcommand, false);
          console.log('re-activated ' + oldcommand.name);
        });

        command.replaced = [];
        console.log('Deactivated command ' + command.name);
      }
    });
  };

  //Member updateBinding function
  inputController.InputController.prototype.updateBinding = function(controlsIn) 
  {
    var self = this;

    //Check to make sure we got a valid controls handle
    if( self.isUndefined(controlsIn) )
    {
      console.error("Input Controller was asked to update bindings for an undefined control!");
      return;
    }

    var controlsToUpdate = [].concat(controlsIn);
    controlsToUpdate.forEach(function(control) 
    {
      self.deactivate(control.name);
      var command = self.registeredCommands[control.name];
      if (command) 
      {
        for(var property in command.bindings) 
        {
            if (control.bindings[property] != undefined)
            {
              command.bindings[property] = control.bindings[property];
            }
        }
        self.activate(control.name);
      }

    });
  };

  //Currently these functions do not do anything becasue they cause an infinite loop
  inputController.InputController.prototype.suspend = function(controlName) 
  {
    console.log("Suspend called for:", controlName);
  };

  inputController.InputController.prototype.resume = function(controlName) 
  {
    console.log("Resume called for:", controlName);
  };


  window.Cockpit.plugins.push(inputController.InputController);
}(window, document));
















// (function (window, document) {
//   var inputController = namespace('systemPlugin.inputController');
//   inputController.InputController = function (cockpit) {
    
//     var self = this;
//     self.cockpit = cockpit;
    
//     self.model = { 
//       commands: [] 
//     };
    

    
//     self.registeredCommands = {};
//     self.registeredControls = {};
    
//     //Add the known controllers
//     self.controllers = [];
//     self.controllers.push(new inputController.Keyboard(cockpit));
//     self.controllers.push(new inputController.Gamepad(cockpit));


//     /* Helper functions */

//     //Checks if a parameter is undefined
//     self.isParameterValid = function(param) {
//       return (typeof param === "undefined");
//     }

//     self.checkDuplicates = function () {
//       var commandBindings = [];
//       var duplicateInformation = [];

//       for (var command in self.registeredCommands) {
//         if (self.registeredCommands[command].active) {
//           for (var binding in self.registeredCommands[command].bindings) {
//             commandBindings.push({
//               value: binding + ':' + self.registeredCommands[command].bindings[binding],
//               name: self.registeredCommands[command].name
//             });
//           }
//         }
//       }
//       commandBindings.forEach(function (binding) {
//         commandBindings.forEach(function (checkBinding) {
//           if (binding === checkBinding)
//             return;
//           if (binding.value === checkBinding.value) {
//             duplicateInformation.push('Command name: \'' + binding.name + '\' Binding: ' + binding.value);
//           }
//         });
//       });
//       if (duplicateInformation.length > 0) {
//         self.cockpit.emit('plugin-input-controller-duplicates', duplicateInformation);
//         console.log('Found duplicate commands: \n' + duplicateInformation.join('\n'));
//       }
//     };



//     inputController.InputController.prototype.register = function (control) {
//       this._register(control, true);
//     };

//     inputController.InputController.prototype.commands = function() {
//       return this.model.commands();
//     };

//     /* Crawl the plugins looking for those with settings definitions */
//     this.cockpit.loadedPlugins.forEach(function (plugin) {
//       if (plugin.inputDefaults !== undefined) {
//         if (typeof plugin.inputDefaults == 'function') {
//           self.register(plugin.inputDefaults());
//         } else {
//           self.register(plugin.inputDefaults);
//         }
//       }
//     });
//     console.log("Registered inputmanager");
//     console.log(self);
//     return self;
//   };

//   inputController.isParameterValid= function(param) {
//       return (typeof param === "undefined");
//   };

//   /* Listeners and callbacks */
//   inputController.InputController.prototype.listen = function listen() 
//   {
//     var self = this;

//     //Activate callback
//     this.cockpit.on('InputController.activate', function(controls, fn) {
//       console.log("InputController.activate called:", controls);

//       if(!isParameterValid(controls))
//       {
//         console.error("Input Controller was asked to activate an undefined control!");
//         return;
//       }

//       //Activate the control passed to the plugin
//       self.activateControls(controls);
      
//       //If there is a function attached, activate it
//       if(fn !== undefined)
//       {
//         fn();
//       }
//     });

//     //Deactivate callback
//     this.cockpit.on('InputController.deactivate', function(controls, fn) {
//       console.log("InputController.deactivate called:", controls);

//       if(!isParameterValid(controls))
//       {
//         console.error("Input Controller was asked to deactivate an undefined control!");
//         return;
//       }

//       //deactivate the control passed to the plugin
//       self.deactivateControl(controls);
      
//       //If there is a function attached, activate it
//       if(fn !== undefined)
//       {
//         fn();
//       }
//     });

//     //getCommands callback
//     this.cockpit.on('InputController.getCommands', function(fn) {
//       console.log("InputController.getCommands called.");
      
//       if(fn !== undefined)
//       {
//         //Return a clone of the commands so users cannot change things
//         var commands = self.model.commands.map(function(command) {
//           return {
//             name: command.name,
//             description: command.description,
//             bindings: command.bindings,
//             defaults: command.defaults
//           }
//         });

//         //Call the attached functions
//         fn(commands);
//       }
//       else
//       {
//         console.log("No function provided to InputController.getCommands");
//         return;
//       }

//     });

//     //Register callback
//     this.cockpit.on('InputController.register', function(controls, fn) {
//       console.log("InputController.register called:", controls);

//       //Check to make sure we have a valid set of controls
//       if(typeof controls === "undefined")
//       {
//         console.error("Input Controller was asked to register an undefined control!");
//         return;
//       }

//       //Call the internal register function
//       self.registerControl(controls);

//       //If there is a function attached, activate it
//       if(fn !== undefined)
//       {
//         fn();
//       }
//     });

//     //Update bindings callback
//     this.cockpit.on('InputController.updateBinding', function(controls, fn) {
//       console.log("InputController.updateBinding called:", controls);

//       //Check to make sure we have a valid set of controls
//       if(typeof controls === "undefined")
//       {
//         console.error("Input Controller was asked to update the bindings to an undefined control!");
//         return;
//       }

//       //Call the internal register function
//       self.updateControlBinding(controls);

//       //If there is a function attached, activate it
//       if(fn !== undefined)
//       {
//         fn();
//       }
//     });

//     //Suspend all callback
//     this.cockpit.on('InputController.suspendAll', function(fn) {
//       console.log("InputController.suspendAll called.");
    
//       //If there is a function attached, activate it
//       if(fn !== undefined)
//       {
//         fn();
//       }  
//     });

//     //Resume all callback
//     this.cockpit.on('InputController.resumeAll', function(fn) {
//       console.log("InputController.resumeAll called.");
//     });
//   };


//   /*Member functions*/
//   //Activates a specificed control
//   inputController.InputController.prototype.activateControls = function(controls) {
//     var self = this;
//     console.log("InputController.activateControls called");

//     //Check to make sure we have a valid set of controls
//     if(typeof controls === "undefined")
//     {
//       console.error("InputController.activateControls() was asked to activate an undefined control!");
//       return;
//     }

//     //The controls can be an array, so let's treat it as such
//     var controlsToActivate = [].concat(controls);
//     controlsToActivate.forEach(function(control) {

//     });

//   };

//   //Updates the binding to a specificed control
//   inputController.InputController.prototype.updateControlBinding = function(controls) {
//     var self = this;

//     //Make sure we got a valid control set
//     if(typeof controls === "undefined")
//     {
//       console.error("Input Controller was asked to update bindings to an undefined control!");
//       return;
//     }

//     console.log("Update binding for:", controls);

//     //The controls can be an array, so let's treat it as such
//     var controlsToUpdate = [].concat(controls);
//     controlsToUpdate.forEach(function(control) {
      
//       //First, deactivate the current control
//       self.deactivateControl(control);

//       //Then, try to grab a handle to it
//       var registeredControl = self.registeredControls[control.name];
      
//       if(typeof registeredControl === "undefined")
//       {
//         console.log("This control is not registered with us. Let's register it.");
//         self.registerControl(control);
//       }
//       else
//       {
//         console.log("This control is already registered with us");
//       }
//     });

//   };

//   //Deactivates the specificed control
//   inputController.InputController.prototype.deactivateControl = function(control) {
//     var self = this;

//     //Make sure we got a valid control set
//     if(typeof control === "undefined")
//     {
//       console.error("Input Controller was asked to deactivate an undefined control!");
//       return;
//     }

//     console.log("Deactivating control:", control);

//     //Grab a handle to the internal representation of the control
//     var registeredControl = self.registeredControls[control.name];
    
//     //Check if it is undefined
//     if(typeof registeredControl === "undefined")
//     {
//       console.log("This control is undefined. This is not a problem, yet");
//       return;
//     }

//     registeredControl.active = false;
//     self.unregisterControl(registeredControl);
//   };

//   //Registers the control with us
//   inputController.InputController.prototype.registerControl = function(control) {
//     var self = this;

//     //Make sure we got a valid control to register
//     if(typeof control === "undefined")
//     {
//       console.error("Input Controller was asked to register an undefined control!");
//       return;
//     }

//     console.log("Trying to register", control);

//     //Create a new command
//     //This can't be right? That is a whole lot of news
//     var commandToAdd = new inputController.Command(control);
//     commandToAdd.active = true;
    
//     //Add our newly created command to our local array
//     self.registeredControls[commandToAdd.name] = commandToAdd;

//     //And update our model that we give to users
//     self.model.commands.push(commandToAdd);

//     //Let the rest of cockpit know that we just registered a new command
//     self.cockpit.emit('InputController.registeredCommand', commandToAdd);

//     //For each of the controllers, update the bindings
//     console.log("Registering:", commandToAdd);
//     self.controllers.forEach(function(controller) {
//       controller.register(commandToAdd);
//     });

//   };

//   //Unregisters a control with us
//   inputController.InputController.prototype.unregisterControl = function(control) {
//     var self = this;

//     //Make sure we got a valid control to register
//     if(typeof control === "undefined")
//     {
//       console.error("Input Controller was asked to unregister an undefined control!");
//       return;
//     }

//     //Remove it from the registered controls
//     //Allegedly, an undefined is faster than a delete. So just undefine it
//     var elementToRemove = control.name;
//     self.registeredControls[elementToRemove] = undefined;

//     //And remove it from the model
//     $.each(self.model.commands, function(i) {
//       if(self.model.commands[i].name === elementToRemove) {
//           self.model.commands.splice(i,1);
//           return false;
//       }
//     });
//   };


//   //Suspend a control
//   inputController.InputController.prototype.suspend = function(control) {
//     var self = this;

//     console.log("Suspending:", control);
//   }

//   //Resume all operation
//   inputController.InputController.prototype.resume = function(control) {
//     var self = this;

//     console.log("Resuming:", control);
//   }


//   window.Cockpit.plugins.push(inputController.InputController);
// }(window, document));