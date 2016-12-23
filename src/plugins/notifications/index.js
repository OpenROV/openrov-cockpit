var log,error,debug,warn;
const nedb = require('nedb');
const path = require('path');
const bluebird = require('bluebird');
const mkdirp = require('mkdirp');
const Listener = require('Listener');

var _announcementScheduled = false;
class Notifications {

    constructor(name, deps) {
        log = deps.logger.info.bind(deps.logger);
        error = deps.logger.error.bind(deps.logger);
        debug = deps.logger.debug.bind(deps.logger);
        warn = deps.logger.warn.bind(deps.logger);
        log("Loaded Notifications plugin");

        this.globalBus = deps.globalEventLoop; // This is the server-side messaging bus. The MCU sends messages to server plugins over this
        this.cockpitBus = deps.cockpit; // This is the server<->client messaging bus. This is how the server talks to the browser
        var self = this;
        this.db = null; //db not yet initialized

        this.listeners = {
            settings: new Listener(self.globalBus, 'settings-change.notifications', true, function(settings) {
                self.settings = settings.notifications;
                self.initDB()
                .then(self.announceNotices.bind(self));
            }),

            peristentNotices: new Listener(self.globalBus, 'notification', false, function(notice) {
                self.cockpitBus.emit('plugin.notification.notify', {
                    timestamp: Date.now(),
                    notice: notice
                });
                if (!self.db) {
                    return; //ignore persistening if the db is not ready
                }

                self.db.insert({
                    timestamp: Date.now(),
                    notice: notice
                });
            }),

            clear: new Listener(self.cockpitBus, 'plugin.notifications.clear', false, function() {
                self.db.removeAsync({}, {
                        multi: true
                    })
                    .then(function(numRemoved) {
                        trace(`Cleared ${numRemoved} notifications`);
                        self.announceNotices();
                    })
            })
        }
    }


    start() {
        // Enable the listeners!
        this.listeners.settings.enable();
        this.listeners.peristentNotices.enable();
        this.listeners.clear.enable();
        if (process.env.NODE_ENV == "development") {
          this.globalBus.emit("notification", "Notification service started");
        }
    }

    // This is called when the plugin is disabled
    stop() {
        // Disable listeners
        this.listeners.settings.disable();
        this.listeners.peristentNotices.disable();
        this.listeners.clear.disable();
    }

    announceNotices() {
        var self = this;
        if (_announcementScheduled) {
            return;
        }
        setTimeout(function() {
            self.getAllNotifications()
                .then(function(notices) {
                    self.cockpitBus.emit("plugin.notification.all-notices", notices);
                })
                .catch(function(ex) {
                    throw ex;
                })
                .then(function() {
                    _announcementScheduled = false;
                });
        }, 1000 * 60); //Throttle at 1 per minute

    }

    getAllNotifications() {
        return this.db.findAsync({});
    }

    initDB() {
        var self = this;
        return bluebird.try(function() {
            if (self.db){
                //Only initialize once, changes to settings used by nedb will requires a process restart.
                return;
            }
            if (process.env.NODE_ENV == "development") {
                self.db = new nedb();
                bluebird.promisifyAll(self.db);
                //This intentionally does not honor selective debug logging. 
                warn('neDB intialized as inMemory -- ONLY USE FOR TESTING');
            } else {
                var nedbDir = process.env.DATADIR || '/etc'
                mkdirp.sync(path.join(nedbDir, 'OpenROV'));
                trace('database: ' + path.join(nedbDir, 'OpenROV/notifications.db'));
                self.db = new nedb({
                    filename: path.join(nedbDir, 'OpenROV/notifications.db'),
                    autoload: true
                });
                bluebird.promisifyAll(self.db);
                self.db.persistence.setAutocompactionInterval(process.env.AutocompactionInterval || 1000 * 60 * 10);
            }

        })
    }

    // This is used to define user settings for the plugin. We populated some example properties below.
    // The UI for changing the settings is automatically generated in the Settings applet.
    getSettingSchema()
    {
        //from http://json-schema.org/examples.html
        return [{
            'title': 'Notification Settings',
            'type': 'object',
            'id': 'notifications',
            'properties': {
                'persistBetweenReboots': {
                    'type': 'boolean',
                    'default': true
                }
            }
        }];
    }

}

module.exports = function(name, deps) {
    return new Notifications(name, deps);
};
