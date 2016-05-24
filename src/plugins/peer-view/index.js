const express = require('express');

function peerview(name, deps) {

  console.log('peer-webrtc plugin started.');

  deps.app.get('/msgpack.min.js', function(req, res) {
    res.sendFile('msgpack.min.js', {root: __dirname+ '/node_modules/msgpack-lite/dist'});
  });

    deps.app.get('/simplepeer.min.js', function(req, res) {
    res.sendFile('simplepeer.min.js', {root: __dirname+'/node_modules/simple-peer'});
  });

  var connections = {};

  var io = require('socket.io')(deps.server,{path:'/peerview'});

  io.on('error',function(err){console.log('Error:' + err)});

  io.on('connection', function (socket) {
    connections[socket.id] = socket;
    socket.broadcast.emit('user connected');

    socket.on('heartbeat', function(data){
      socket.broadcast.emit('heartbeat',{type:data,connectionId:socket.id});
    });

    socket.on('signal', function(id, data){
      socket.broadcast.to(id).emit('signal', data, socket.id);
    });

    socket.on('peer-connect-offer',function(peer_id,callback){
      //We intentionally swap out the target's id for the sender's id.
      if (connections[peer_id] === undefined){
        callback(false);
        return;
      }
      connections[peer_id].emit('peer-connect-offer',socket.id,callback);
    });

    socket.on('close',function(){
        delete connections[socket.id];
    })

  });


}

module.exports = function(name, deps){
  return new peerview(name,deps);
}
