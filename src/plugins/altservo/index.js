function altservo(name, deps) {
  console.log('This is where altservo plugin code would execute in the node process.');
deps.io.sockets.on('connection', function (socket) {
 socket.on('altservo_set', function (value) {
      deps.rov.send('asrt('+value*100+')');
      console.log('asrt('+value*100+') sent');
    });
});
}
module.exports = altservo;
