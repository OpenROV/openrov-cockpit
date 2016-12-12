var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));
var path = require('path');

var BoardInterface = function () 
{
};

BoardInterface.prototype.Compose = function (platform) 
{
  // Temporary container used for cpu detection and info loading
  var board = { targetBoard: platform.board };
  var self = this;

  console.log( 'BOARD: Composing Mock board interface...' );

  return self.LoadInfo(board)
    .then(self.LoadPinMap)
    .then(self.LoadInterface);
};

BoardInterface.prototype.LoadInfo = function (board) 
{
  board.info = {};

  console.log('BOARD: Loading board info from Mock EEPROM...');

  return fs.readFileAsync(path.resolve(__dirname, 'boards/mock3000/eeprom.json'), 'utf8')
    .then(JSON.parse)
    .then(function (info) 
    {
      console.log( "BOARD: Loaded Board Info" );
      console.log( "BOARD: -------------------" );
      console.log( `BOARD: Product ID: ${info.productId}` );
      console.log( `BOARD: Board ID: ${info.boardId}` );
      console.log( "BOARD: Details:" );

      board.info = info;
      board.targetBoard.info = board.info;
      return board;
    });
};

BoardInterface.prototype.LoadPinMap = function (board) 
{
  return fs.readFileAsync(path.resolve(__dirname, 'boards/' + board.info.boardId + '/cpuPinmap.json'))
  .then(JSON.parse)
  .then(function (pinmap) 
  {
    console.log( "BOARD: Loaded Pinmap" );
    console.log( "BOARD: -------------------" );
    console.log( pinmap );

    board.pinmap = pinmap;
    board.targetBoard.pinmap = board.pinmap;
    return board;
  });
};

BoardInterface.prototype.LoadInterface = function (board) 
{
  require('./boards/' + board.info.boardId + '/setup.js')(board.targetBoard);
  return board;
};

module.exports = new BoardInterface();