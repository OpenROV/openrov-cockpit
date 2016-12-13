const Promise   = require('bluebird');
const fs        = Promise.promisifyAll(require('fs'));
const path      = require('path');
const Parser    = require('binary-parser').Parser;

// TODO: Switch to debug logger

class BoardInterface
{
  constructor()
  {
    // Define a parser for the board information stored on the controller board's eeprom
    this.eepromParser = Parser.start().endianess('little').uint32('length').string('data', 
    {
        encoding: 'utf8',
        length: 'length'
    });
  }

  Compose( platform )
  {
    var self = this;

    // Temporary container used for cpu detection and info loading
    self.board = { targetBoard: platform.board };

    console.log( 'BOARD: Composing RPI board interface...' );

    return this.LoadInfo()
      .then( () =>
      {
        return this.LoadPinMap();
      })
      .then( () =>
      {
        return this.LoadInterface()
      });
  }

  LoadInfo()
  {
    var self = this;

    console.log('BOARD: Loading board info from EEPROM...');

    return fs.readFileAsync( path.resolve( '/sys/class/i2c-adapter/i2c-1/1-0054/eeprom' ) )
      .then( (data) => 
      {
        return self.eepromParser.parse( data ).data;
      })
      .then(JSON.parse)
      .then( (info) =>
      {
        console.log( "BOARD: Loaded Board Info" );
        console.log( "BOARD: -------------------" );
        console.log( `BOARD: Product ID: ${info.productId}` );
        console.log( `BOARD: Board ID: ${info.boardId}` );
        console.log( "BOARD: Details:" );
        console.log( info.details );

        self.board.info = info;
      });
  }

  LoadPinMap() 
  {
    var self = this;

    console.log( `BOARD: Loading CPU pinmap for Board[${self.board.info.boardId}]...` );

    return fs.readFileAsync(path.resolve(__dirname, 'boards/' + self.board.info.boardId + '/cpuPinmap.json' ) )
      .then(JSON.parse)
      .then( (pinmap) =>
      {
          console.log( "BOARD: Loaded Pinmap" );
          console.log( "BOARD: -------------------" );
          console.log( pinmap );

          self.board.pinmap = pinmap;
      });
  };

  LoadInterface() 
  {
    var self = this;

    self.board.targetBoard.info   = self.board.info;
    self.board.targetBoard.pinmap = self.board.pinmap;

    require( './boards/' + self.board.info.boardId + '/setup.js' )( self.board.targetBoard );
  };
}

module.exports = new BoardInterface();