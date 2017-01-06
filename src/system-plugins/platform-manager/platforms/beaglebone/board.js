const Promise = require('bluebird');
const fs      = Promise.promisifyAll(require('fs'));
const path    = require('path');
const logger = require('AppFramework.js').logger;

class BoardInterface
{
  constructor()
  {
    this.board = {};
  }

  Compose( platform )
  {
    var self = this;

    // Temporary container used for cpu detection and info loading
    self.board = { targetBoard: platform.board };

    logger.debug('BOARD: Composing BBB interface...');

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

    logger.debug('BOARD: Loading board info from Mock EEPROM...');

    return fs.readFileAsync( path.resolve( '/opt/openrov/system/etc/2xBoardInfo.json' ), 'utf8' )
      .then( JSON.parse )
      .then( (info) =>
      {
        logger.debug( "BOARD: Loaded Board Info" );
        logger.debug( "BOARD: -------------------" );
        logger.debug( `BOARD: Product ID: ${info.productId}` );
        logger.debug( `BOARD: Board ID: ${info.boardId}` );
        logger.debug( "BOARD: Details:" );
        logger.debug( info.details );

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
        logger.debug( "BOARD: Loaded Pinmap" );
        logger.debug( "BOARD: -------------------" );
        logger.debug( pinmap );

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