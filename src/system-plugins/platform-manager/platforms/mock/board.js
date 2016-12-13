const Promise = require('bluebird');
const fs      = Promise.promisifyAll(require('fs'));
const path    = require('path');

class BoardInterface
{
  constructor()
  {
  }

  Compose( platform )
  {
    var self = this;

    // Temporary container used for cpu detection and info loading
    self.board = { targetBoard: platform.board };

    console.log( 'BOARD: Composing Mock board interface...' );

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

    console.log('BOARD: Loading board info from Mock EEPROM...');

    return fs.readFileAsync( path.resolve( __dirname, 'boards/mock3000/eeprom.json' ), 'utf8' )
      .then( JSON.parse )
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

    return fs.readFileAsync( path.resolve( __dirname, 'boards/' + self.board.info.boardId + '/cpuPinmap.json' ) )
      .then( JSON.parse )
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

    self.board.targetBoard.info = self.board.info;
    self.board.targetBoard.pinmap = self.board.pinmap;

    require( './boards/' + self.board.info.boardId + '/setup.js' )( self.board.targetBoard );
  };
}

module.exports = new BoardInterface();