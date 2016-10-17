const log = require('Debug')('log:about');
const trace = require('Debug')('trace:about');
const debug = require('Debug')('debug:about');

const Listener = require('Listener');

class About {

    constructor(name, deps) {

        log("Loaded About plugin");

        this.globalBus = deps.globalEventLoop; // This is the server-side messaging bus. The MCU sends messages to server plugins over this
        this.cockpitBus = deps.cockpit; // This is the server<->client messaging bus. This is how the server talks to the browser
        var self = this;
    }

}

module.exports = function(name, deps) {
    return new About(name, deps);
};