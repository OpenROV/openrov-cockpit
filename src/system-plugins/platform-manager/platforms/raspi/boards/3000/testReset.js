var EventEmitter = require("events").EventEmitter;

var loadFunctions = require( "./functions.js" );

var board = new EventEmitter();
board.info = { productId: "3000" };
board.pinmap = { "UC_RESETN": { "gpio": 18 } }

loadFunctions( board );

console.log( "Starting reset" );

board.resetMCU();

console.log( "Reset finished" );
