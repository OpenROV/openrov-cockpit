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
 
            this.inputDefaults = function inputDefaults() {
                var self = this;
                return [{
                    name: 'systemDiagnostics.popup',
                    description: 'Opens the diagnostics applet in a new window.',
                    defaults: { keyboard: 'ctrl+s d i a g' },
                    down: function () {
                     window.open('popup?app=_system_diagnostics');
                    }
                }];
            };

            this.cockpit.on("mcu.reset",function(){
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
        }
    }

    // Add plugin to the window object and add it to the plugins list
    var plugins = namespace('plugins');
    plugins.systemDiagnostics = systemDiagnostics;
    window.Cockpit.plugins.push( plugins.systemDiagnostics );    
}(window));