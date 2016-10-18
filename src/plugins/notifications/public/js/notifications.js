(function(window)
{
    'use strict';
    class notifications
    {
        constructor(cockpit)
        {
            console.log('System Diagnostics Plugin running');
            var self = this;
            this.cockpit = cockpit;
            this.rov = cockpit.rov;

            this.rov.on("plugin.notification.notify", function(notice) {
                self.cockpit.emit("plugin.notification.notify", notice);
            })

            this.rov.withHistory.on('plugin.notification.all-notices', function(notices) {
                self.cockpit.emit('plugin.notification.all-notices', notices);
            })

            this.cockpit.on('plugin.notifications.clear', function() {
                self.rov.emit('plugin.notifications.clear');
            })
        }
    }

    // Add plugin to the window object and add it to the plugins list
    var plugins = namespace('plugins');
    plugins.notifications = notifications;
    window.Cockpit.plugins.push(plugins.notifications);
}(window));