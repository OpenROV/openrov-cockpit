'use strict'
var dir = __dirname;
function Logger(options) {

var pino = require('pino');

//var pretty = pino.pretty()
//pretty.pipe(process.stdout)
var log = pino(options);//,pretty);
var loggers = [log];
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

const Arborsculpt = require('pino-arborsculpture')
const arbor = new Arborsculpt({
  path: dir+'/adjustments.json',
  loggers: loggers, //Will this capture children as well? If not we will need Arborsculpt entries for them as well.
  interval: 60000 // the default
})
log._tagged = true;
log.info('monitoring ',  dir+'/adjustments.json', ' for logging adjustments.');

arbor.on('error', function (err) {
  log.error(err,'there was a problem reading the file or setting the level');
})

log.on('level-change', function(lvl, val, prevLvl, prevVal){
  if  ((prevLvl !== undefined) && (lvl!==prevLvl)){
    this[lvl](`logging level changed from ${prevLvl} to ${lvl}`);
  }
  if (!this._tagged){
    //this is the first time we have seen the logger, it could be a child.
    this._tagged = true;
    loggers.push(this);
  }
})

log.monitor=function(logger,path){
    var childArbor = new Arborsculpt({
      path: path,
      loggers: [logger], //Will this capture children as well? If not we will need Arborsculpt entries for them as well.
      interval: 60000 // the default
    })  
}

return log;
}


module.exports = Logger;