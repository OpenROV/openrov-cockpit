var uartPath = '/dev/ttyO1';
var uartBaud = 115200;
var bridge = function(){
  return require('SerialBridge.js')(uartPath,uartBaud);
}
module.exports = bridge;

