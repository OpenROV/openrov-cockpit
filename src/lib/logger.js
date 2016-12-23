'use strict'
function Logger(options) {

var pino = require('pino');
var pretty = pino.pretty()
pretty.pipe(process.stdout)
var log = pino(options,pretty);

//AOP: Inject trace behavior in all function calls
/* Should this be handled by an external jstrace instead?
(function () {
  var oldCall = Function.prototype.call;
  var newCall = function(self) {
    Function.prototype.call = oldCall;
    if (this.name){
      log.trace('Function called:', this.name);
    }
    var args = Array.prototype.slice.call(arguments, 1);
    var res = this.apply(self, args);
    Function.prototype.call = newCall;
    return res
  }
  Function.prototype.call = newCall;
})();
*/
return log;
}


module.exports = Logger;