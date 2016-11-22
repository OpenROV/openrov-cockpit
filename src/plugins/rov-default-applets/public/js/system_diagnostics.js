(function(window) 
{
    'use strict';
    class systemDiagnostics 
    {
        constructor( cockpit )
        {
            console.log('System Diagnostics Plugin running');
            var self=this;
            this.cockpit = cockpit;
            this.rov = cockpit.rov;

            this.actions =  {
              'systemDiagnostics.popup':{
                    description: 'Opens the diagnostics applet in a new window.',
                    controls: {
                        button: {
                            down: function() {
                              window.open('popup?app=_system_diagnostics');
                            }         
                        }
                    }
                }
            }

            this.inputDefaults = {
                keyboard: {
                    "alt+s d i a g": { 
                        type: "button",
                        action: 'systemDiagnostics.popup' }
                }
            }



            this.cockpit.on("mcu.ResetMCU",function(){
                self.rov.emit("mcu.ResetMCU");              
            })
            this.cockpit.on("mcu.FlashESCs",function(){
                self.rov.emit("mcu.FlashESCs");              
            })
            this.cockpit.on("mcu.RebuildMCUFirmware",function(){
                self.rov.emit("mcu.RebuildMCUFirmware");              
            })
            this.cockpit.on("mcu.UpdateFirmware",function(){
                self.rov.emit("mcu.UpdateFirmware");              
            })

            // Command in form of: "commandName( params )"
            this.cockpit.on("mcu.SendCommand", function( commandIn )
            {
                self.rov.emit("mcu.SendCommand", commandIn );
            })                                    
        }
    }

    // Add plugin to the window object and add it to the plugins list
    var plugins = namespace('plugins');
    plugins.systemDiagnostics = systemDiagnostics;
    window.Cockpit.plugins.push( plugins.systemDiagnostics );    
}(window));