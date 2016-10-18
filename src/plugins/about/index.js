const log = require('debug')('log:about');
const trace = require('debug')('trace:about');
const debug = require('debug')('debug:about');

const bluebird = require('bluebird');
const Listener = require('Listener');
const execFile = require('child_process').execFile;

//private functions


function execAsync(command,args){
    return new bluebird(function(resolve,reject){
        return execFile(command,args,function(error,stdout,stderr){
            if (error){
                 resolve(JSON.stringify(error));
            }
            resolve(stdout,stderr);
        })
    })
}

function getpsAux() {
    return execAsync('ps',['aux']);
}

function getFree() {
    return execAsync('free',[]);
}

function getDF() {
    return execAsync('df',[]);
}

function getJournalCTL() {
    return execAsync('journalctl',['-o json']);
}

function getROVImageVersion(){
    return execAsync('cat',['/ROV-Suite-version'])
}

class About {

    constructor(name, deps) {

        log("Loaded About plugin");

        this.globalBus = deps.globalEventLoop; // This is the server-side messaging bus. The MCU sends messages to server plugins over this
        this.cockpitBus = deps.cockpit; // This is the server<->client messaging bus. This is how the server talks to the browser
        this.loopDelays = [];
        this.notifications = [];
        this.deps=deps;
        var self = this;

        this.listeners = {
            settings: new Listener(self.globalBus, 'settings-change.about', true, function(settings) {
                self.settings = settings.about;
            }),

            loopDelays: new Listener(self.globalBus, 'plugin.host-diagnostics.loopDelay', false, function(delay){
                self.loopDelays.push({timestamp:Date.now(),delay:delay});
                if (self.loopDelays.length==99){
                    self.globalBus.emit('notification','The ROV embedded computer has been struggling to process messages.');
                }
                if (self.loopDelays.length==100){
                    self.loopDelays.shift();
                }
            }),

            notifications: new Listener(self.globalBus, 'plugin.notification.all-notices', false, function(notices){
                self.notifications=notices;
            }),

            dumpReport: new Listener(self.cockpitBus, 'plugin.about.dumpReport', false, function(callback) {
                var report={}
                getpsAux()
                .then (function(stdout,stderr){
                    report.ps=stdout;
                    trace("ps:"+stdout);
                })
                .then (function(){
                    report.loopDelays=self.loopDelays;
                    report.notifications = self.notifications;
                    report.config=self.deps.config;
                })
                .then (getFree)
                .then (function(stdout,stderr){
                    report.free = stdout;
                })
                .then (getDF)
                .then (function(stdout,stderr){
                    report.df = stdout;
                })   
                .then (getJournalCTL)
                .then (function(stdout,stderr){
                    report.journalctl = stdout;
                })     
                .then (getROVImageVersion)
                .then (function(stdout,stderr){
                    report.rovImageVersion = stdout;
                })                                          
                .then (function(){
                    callback(JSON.stringify(report));
                })                
            })
        }
    }

    start() {
        // Enable the listeners!
        this.listeners.settings.enable();
        this.listeners.loopDelays.enable();
        this.listeners.notifications.enable();
        this.listeners.dumpReport.enable();
    }

    // This is called when the plugin is disabled
    stop() {
        // Disable listeners
        this.listeners.settings.disable();
        this.listeners.loopDelays.disable();
        this.listeners.notifications.disable();        
        this.listeners.dumpReprot.disable();
    }    

}

module.exports = function(name, deps) {
    return new About(name, deps);
};