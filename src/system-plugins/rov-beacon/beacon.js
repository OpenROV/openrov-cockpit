"use strict";
const dgram = require('dgram');
const EventEmitter = require('events');
const os = require('os');
var ifaces = os.networkInterfaces();
function getBroadcastAddress(addressString) {
    var address = addressString.split('.');
    address[3] = '255';
    return address.join('.');
}

class Beacon extends EventEmitter{

    constructor (options){
        if(!options){
            options = {}
        }
        super();
        this.port = options.port || 8088;
        this.broadcastAddress = options.broadcastAddress || '192.168.1.255';//;'230.185.192.108';
        this.beaconRate = options.beaconRate || 3000;
       
    }

    broadcast(messageFn) {
        var self = this;
        this.server = dgram.createSocket('udp4');
        let server = this.server;
        server.on('listening', () => {
        var address = server.address();
            server.setBroadcast(true)
       //     server.setMulticastTTL(128);
       //     server.addMembership( self.broadcastAddress);   
        });

        this.beaconInterval = setInterval(broadcastNew, this.beaconRate);

        function broadcastNew() {
            
            //Updated to iterate over all ipv4 interfaces
            var message = new Buffer(JSON.stringify(messageFn()));
            Object.keys(ifaces).forEach(function(iface) {
                ifaces[iface].forEach(function(idetail) {
                    if('IPv4' !== idetail.family || idetail.internal !== false) {
                        //Skip over internal (i.e. 127.0.0.1) and non ipv4
                        return;
                    }
                    idetail.broadcastAddress = getBroadcastAddress(idetail.address);
                    server.send(message, 0, message.length, self.port, idetail.broadcastAddress);
                });
            });
        }
        server.bind();
    }

    listen () {
        var self=this;
        this.client = dgram.createSocket('udp4');
        let client = this.client;
        
        client.on('listening', function () {
            var address = client.address();
            console.log('UDP Client listening on ' + address.address + ":" + address.port);
            client.setBroadcast(true)
      //      client.setMulticastTTL(128); 
      //      client.addMembership( self.broadcastAddress);
        });

        client.on('message', function (message, remote) {   
            self.emit("deviceAnnouncement",{remoteAddress:remote.address,remotePort:remote.port,data:message})
        });

        client.bind(this.port);

    }

    stop () {
        clearInterval(this.beaconInterval);
        if (this.server){
            this.server.close();
        }
        if (this.client){
            this.client.close();
        }
    }
}

module.exports = function(options){
    return new Beacon(options)
};
