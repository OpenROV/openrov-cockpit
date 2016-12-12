var Promise   = require('bluebird');
var fs        = Promise.promisifyAll(require('fs'));
var path      = require('path');
var Parser    = require('binary-parser').Parser;

// TODO: Switch to debug logger

// Define a parser for the board information stored on the controller board's eeprom
var eepromParser = Parser.start().endianess('little').uint32('length').string('data', 
{
    encoding: 'utf8',
    length: 'length'
});

var BoardInterface = function () 
{
};

BoardInterface.prototype.Compose = function (platform) 
{
  // Temporary container used for cpu detection and info loading
  var board = { targetBoard: platform.board };
  var self = this;

  console.log( 'BOARD: Composing RPI board interface...' );

  return self.LoadInfo(board)
    .then(self.LoadPinMap)
    .then(self.LoadInterface);
};

BoardInterface.prototype.LoadInfo = function (board) 
{
  board.info = {};
  console.log('BOARD: Loading board info from EEPROM...');

  return fs.readFileAsync(path.resolve('/sys/class/i2c-adapter/i2c-1/1-0054/eeprom'))
  .then(function (data) 
  {
    return eepromParser.parse(data).data;
  })
  .then(JSON.parse)
  .then(function (info) 
  {
    console.log( "BOARD: Loaded Board Info" );
    console.log( "BOARD: -------------------" );
    console.log( `BOARD: Product ID: ${info.productId}` );
    console.log( `BOARD: Board ID: ${info.boardId}` );
    console.log( "BOARD: Details:" );
    console.log( info.details );

    board.info = info;
    board.targetBoard.info = board.info;

    return board;
  });
};

BoardInterface.prototype.LoadPinMap = function (board) 
{
  console.log( `BOARD: Loading CPU pinmap for Board[${board.info.boardId}]...` );

  return fs.readFileAsync(path.resolve(__dirname, 'boards/' + board.info.boardId + '/cpuPinmap.json' ) )
    .then(JSON.parse)
    .then(function( pinmap ) 
    {
        console.log( "BOARD: Loaded Pinmap" );
        console.log( "BOARD: -------------------" );
        console.log( pinmap );

        board.pinmap = pinmap;
        board.targetBoard.pinmap = board.pinmap;
        return board;
    });
};

BoardInterface.prototype.LoadInterface = function( board ) 
{
  console.log('BOARD: Loading board interface...');
  require('./boards/' + board.info.boardId + '/setup.js')( board.targetBoard );

  return board;
};

module.exports = new BoardInterface();