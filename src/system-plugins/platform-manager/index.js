// To eliminate hard coding paths for require, we are modifying the NODE_PATH to include our lib folder
var oldpath = '';
if (process.env.NODE_PATH !== undefined) 
{
  oldpath = process.env.NODE_PATH;
}

// Just in case already been set, leave it alone
process.env.NODE_PATH = __dirname + '/modules:' + __dirname + '/platforms:' + oldpath;
require('module').Module._initPaths();

var path            = require('path');
var Promise         = require('bluebird');
var fs              = Promise.promisifyAll(require('fs'));
var BoardInterface  = require('BoardInterface.js');
var CPUInterface    = require('CPUInterface.js');
var logger;


function PlatformManager(name, deps) 
{
  var self = this;
  var platformName = '';
  this.platform = {};
  this.platform.systemDirectory = deps.config.systemDirectory;
  this.platform.board = new BoardInterface(deps);
  this.platform.cpu = new CPUInterface(deps);
  logger = deps.logger;
  

  ('PLATFORM: Loading platform interfaces...');

  // Load interfaces
  return Promise.try(function () 
  {
    return LoadPlatformName(self.platform);
  })
  .then(LoadCPUInterface)
  .then(LoadBoardInterface)
  .then(function (platform) 
  {
    logger.info('PLATFORM: Successfully loaded configuration for a supported platform.');
    deps.globalEventLoop.emit('platform.supported');

    return self;
  })
  .catch(function (err) 
  {
    //deps.globalEventLoop.emit( "platform.unsupported", error );
    logger.error('PLATFORM: Failed to load platform details for this system: ' + err.message);

    return null;
  });
}

function LoadPlatformName(platform) 
{
  if (process.env.PLATFORM !== undefined) 
  {
    // Allow shortcut
    platform.name = process.env.PLATFORM;
    logger.info('PLATFORM: Platform shortcut set to: ' + platform.name);
    return platform;
  } 
  else 
  {
    var platConfPath = path.resolve(platform.systemDirectory + '/config/platform.conf');

    return fs.readFileAsync(platConfPath, 'utf8').then(function (data) 
    {
      // Parse platform info from configuration file
      var platInfo = JSON.parse(data);
      platform.name = platInfo.platform;
      return platform;
    })
    .catch(function (err) 
    {
      // Can't proceed if we can't determine the platform
      throw new Error('Failed to load platform name');
    });
  }
}

function LoadCPUInterface(platform) 
{
  logger.info('PLATFORM: Loading CPU interface...');

  var CPUInterfaceLoader = require('./platforms/' + platform.name + '/cpu.js');

  return CPUInterfaceLoader
  .Compose(platform)
  .catch(function (err) 
  {
    logger.error('Failed to load CPU interface: ' + err.message);
    throw err;
  })
  .then(function () 
  {
    return platform;
  });
}

function LoadBoardInterface(platform) 
{
  logger.info('PLATFORM: Loading Board interface...');

  var BoardInterfaceLoader = require('./platforms/' + platform.name + '/board.js');

  return BoardInterfaceLoader
  .Compose(platform)
  .catch(function (err) 
  {
    logger.error('Failed to load board interface: ' + err.message);  // Continue anyway. Board is optional to operation of cockpit
  })
  .then(function () 
  {
    try
    {
      logger.info( "Setting PRODUCTID to: " + platform.board.info.productId );
      process.env["PRODUCTID"] = platform.board.info.productId;
    }
    catch( err )
    {

    }
    
    return platform;
  });
}

// Export provides the public interface
module.exports = function (name, deps) 
{
  return new PlatformManager(name, deps);
};