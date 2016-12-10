var uartPath = '/dev/ttyAMA0';
var uartBaud = 1500000;
var bridge = function(){
  return require('SerialBridge.js')(uartPath,uartBaud);
}
module.exports = bridge;
