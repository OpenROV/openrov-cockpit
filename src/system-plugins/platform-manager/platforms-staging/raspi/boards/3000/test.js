var EventEmitter = require("events").EventEmitter;

var loadFunctions = require( "./functions.js" );

var board = new EventEmitter();

loadFunctions( board );

console.log( "Starting build" );

board.buildSketch( "OpenROV" );

console.log( "Build finished" );
