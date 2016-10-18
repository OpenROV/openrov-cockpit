(function(window)
{
    'use strict';
    class about
    {
        constructor(cockpit)
        {
            console.log('System About Plugin running');
            var self = this;
            this.cockpit = cockpit;
            this.rov = cockpit.rov;

            this.cockpit.on('plugin.about.dumpReport', function(callback) {
                self.rov.emit('plugin.about.dumpReport',callback);
            })
        }
    }

    // Add plugin to the window object and add it to the plugins list
    var plugins = namespace('plugins');
    plugins.about = about;
    window.Cockpit.plugins.push(plugins.about);
}(window));