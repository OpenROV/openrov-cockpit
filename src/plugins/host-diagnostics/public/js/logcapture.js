(function (window, $, undefined) {
  var consoleRecorder = [];    

  var logcapture;
  logcapture = function logcapture(cockpit) {
      this.cockpit = cockpit;
  }

  logcapture.prototype.listen = function listen() {
    this.cockpit.on("plugin.host-diagnostics.getbrowserlogs",function(callback){
      callback(consoleRecorder);
    });
  }
  window.Cockpit.plugins.push(logcapture);

console.log("Developers, you will want to `blackbox` the logcapture.js script to get the originating line numbers in the chrome console.");
function takeOverConsole(){
    var console = window.console
    if (!console) return
    function intercept(method){
        var original = console[method]
        console[method] = function(){
            consoleRecorder.push({timestamp:Date.now(),msg:Array.prototype.slice.apply(arguments).join(' '),stack:(new Error()).stack});
            if (consoleRecorder.length>500){
              consoleRecorder.shift();
            }
            if (original.apply){
                // Do this for normal browsers
                // This script captures writes to the console log/warn/error for reporting, which means
                // the line number refrenced of the original caller in the Chrome console gets replace
                // with this line.  You can right click on this file in dev tools and choose "blackbox" script
                // and the line numbers will go back to what you expect.
                return original.apply(console, arguments)
            }else{
                // Do this for IE
                var message = Array.prototype.slice.apply(arguments).join(' ')
                return original(message)
            }
        }
    }
    var methods = ['log', 'warn', 'error']
    for (var i = 0; i < methods.length; i++)
        intercept(methods[i])
}
takeOverConsole();
  
}(window, jQuery));