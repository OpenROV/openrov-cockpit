//This file replaces the default app.js to substitute the socket.io server connections
//with the webRTC data channel.
$(function() {
  //TODO: Replace this with relative host logic
  $.getScript('msgpack.min.js')
  $.getScript('simplepeer.min.js', function() {

    var Peer = window.SimplePeer;
    var io = window.io;
    var socket = io(window.location.protocol + '//' +
      window.location.hostname + ':'+window.location.port, {path:'/peerview'});

    var peerOpts= {
        channelConfig: {
     //     ordered: false,
     //     maxRetransmits: 0
        },
        initiator: true,
        trickle: false
      }

    var heartbeatInterval = null;
    socket.on('close',function(){
      if (heartbeatInterval!==null){
        clearInterval(heartbeatInterval);
      }
    });

    socket.on('heartbeat',function(data){
      console.log('Heartbeat: ' + JSON.stringify(data));
      if((!connected) && (!connection_pending) && (data.type=='server')){
        connection_pending = true;
        socket.emit('peer-connect-offer',data.connectionId,function(accepted){
          if (accepted){
            connected == true;
            connect(data.connectionId);
          }
        });
        setTimeout(function(){
          connection_pending = false;
        },30000);
      }
    });

    var connected = false;
    var connection_pending = false;

    var connect = function(peer_id){
      //okay, now we can send the offer
      var p = new Peer(peerOpts);
      var emitter = window.cockpit.rov;
      var self=this;

      p.withHistory = {
        on: function(event, fn) {
          p.on(event, fn);
        }
      };

      p.on('error', function (err) {
        console.error(err); 
        socket.off('signal',signalHander);
        p.destroy();
        connection_pending=false;
        connected=false;
      })

      p.on('signal', function (data) {
        socket.emit('signal',peer_id, data);
        console.log('SIGNAL SENT:', JSON.stringify(data))
      })

      signalHander = function(data,sender_id){
        if (sender_id !== peer_id){
          console.error('Invalid sender_id');
          socket.off('signal',signalHander);          
          p.destroy();
          return;
        }
        p.signal(data);
      }
      socket.on('signal',signalHander);

      var chunkByteBuffer = null;
      const webRTCDataChannelChunkLimit=16*1024; //16KB Chunk Recommendation
      processVideoChunk = function(event,chunk_number,remainingBytes,chunk){
        chunk = new Uint8Array(chunk);
        //p.sendemit('x-h264-video.chunk',chunk_count++,data.length-end,chunk);
        if (chunk_number===1){
          chunkByteBuffer=new Uint8Array(remainingBytes+chunk.length);

        };

        chunkByteBuffer.set(chunk,(chunk_number-1)*webRTCDataChannelChunkLimit);

        if (remainingBytes===0){
          emitter.emit('x-h264-video.data',chunkByteBuffer.buffer,'!nc!');
        }

      }

      p.on('connect', function () {
        console.log('CONNECT')
        $('#t')[0]['rovOnline']=true;
        $('#t')[0]['userRole']='View-Only';
        connected = true;
        p.on('data',function(data){  //where data is an array for emitter events
          var payload = msgpack.decode(data);

          switch(payload[0]){
            case 'x-h264-video.chunk':
              processVideoChunk.apply(this,payload);
            break;
            default:
              emitter.emit.apply(emitter,payload.concat(['!nc!']));
          }
        });

        onAnyHandler = function(){
          if ((arguments.length > 0) &&(arguments[arguments.length-1] === '!nc!')) {
            return;
          }
          if (this.event !== 'newListener') {
            var args = new Array(arguments.length);
            for(var i = 0; i < args.length; ++i) {
                        //i is always valid index in the arguments object
                args[i] = arguments[i];
            }
            p.send(msgpack.encode([this.event].concat(args)));
          }
        };

        emitter.onAny(onAnyHandler);

        //For testing binary transfer limits
        ondataMsgHandler=function(size, data) {
          if ((data === undefined) || (data.byteLength === undefined)) {
            console.error('DATA-MSG: Test packet ' + size + ' failed')
            return;
          }
          if (data.byteLength === size) {
            console.log('DATA-MSG: Test packet ' + size + ' worked')
          } else {
            console.error('DATA-MSG: Test packet ' + size + ' wrong size')
          }
        };
        emitter.on('data-msg', ondataMsgHandler);

        p.on('close',function(){
          socket.off('signal',signalHander);
          emitter.offAny(onAnyHandler);
          emitter.off('data-msg', ondataMsgHandler);
          connected = false;
          console.log('Connection to peer closed');
          //TODO: Architect the system to better handle new ROV connections
          if (connected){
            location.reload();
          }
        });

        cockpit.peerConnected=true;
        window.cockpit.rov.connection='p2p';
        cockpit.rov.on('cockpit.pluginsLoaded', function() {});
      })
      return p;

    };

    socket.on('connect',function(){
      heartbeatInterval=setInterval(function(){
        socket.emit('heartbeat','viewer');
      },10000);
    });





  });

  $('#t')[0]['__'] = function(str) {
    return str;
  };


});
