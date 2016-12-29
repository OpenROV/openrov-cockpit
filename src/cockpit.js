/*
*
* Description:
* This script is the Node.js server for OpenROV.  It creates a server and instantiates an OpenROV
* and sets the interval to grab frames.  The interval is set with the DELAY variable which is in
* milliseconds.
*
*/
// To eliminate hard coding paths for require, we are modifying the NODE_PATH to include our lib folder
var oldpath = '';
if (process.env.NODE_PATH !== undefined) {
  oldpath = process.env.NODE_PATH;
}
// Just in case already been set, leave it alone
process.env.NODE_PATH = __dirname + '/lib:' + oldpath;
require('module').Module._initPaths();

// Add cockpit source dir to the environment variables
process.env[ "COCKPIT_PATH" ] = __dirname;

// Set default logging options
// process.env.DEBUG = "log*,error*," + process.env.DEBUG;

var log = require('debug')('log:system');
var error = require('debug')('error:system');
var debug = require('debug')('debug:system');

debug('Set NODE_PATH to: ' + process.env.NODE_PATH);
// Handle linux signals
if (process.platform === 'linux') {
  process.on('SIGTERM', function () {
    error('got SIGTERM, shutting down...');
    process.exit(0);
  });
  process.on('SIGINT', function () {
    error('got SIGINT, shutting down...');
    process.exit(0);
  });
}
require('systemd');
var includesPollyfill=require("array-includes-pollyfill.js").enable();
var CONFIG = require('./lib/config');
var fs = require('fs');
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server, {
    log: false,
    origins: '*:*',
    path: '/cockpitsocket'
  });
var EventEmitter = require('events').EventEmitter;
var EventEmitter2 = require('eventemitter2').EventEmitter2;
var mkdirp = require('mkdirp');
var path = require('path');
var PluginLoader = require('./lib/PluginLoader');
var CockpitMessaging = require('./lib/CockpitMessaging');
var Q = require('q');
var serveIndex = require('serve-index');
var favicon = require('serve-favicon');
var logger = require('morgan');
var methodOverride = require('method-override');
var session = require('express-session');
var bodyParser = require('body-parser');
var multer = require('multer');
var errorHandler = require('errorhandler');
var pluginFolder = CONFIG.preferences.get('pluginsDownloadDirectory');
var cacheFolder = CONFIG.preferences.get('cacheDirectory');
var Promise = require('bluebird');
var rimrafAsync = Promise.promisify(require('rimraf'));
var mkdirpAsync = Promise.promisify(require('mkdirp'));
var COCKPIT_VERSION;

// Setup required directories
mkdirp(CONFIG.preferences.get('photoDirectory'));
mkdirp(cacheFolder);
if (!process.env.NODE_ENV){
  process.env.NODE_ENV = "production";
}


// NOTE: If you don't increase the default max listeners, you can get a potential memory leak warning
var globalEventLoop = require('./static/js/eventEmitterStoreAndForward.js')(new EventEmitter2());
globalEventLoop.setMaxListeners(20);
var DELAY = Math.round(1000 / CONFIG.video_frame_rate);
io = require('./static/js/socketIOStoreAndForward.js')(io);
var client = new CockpitMessaging(io);
client = require('./static/js/eventEmitterStoreAndForward.js')(client);

// ---------------------------------------------------------------
// Setup Express App
// ---------------------------------------------------------------
app.use(express.static(__dirname + '/static/'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('port', process.env.LISTEN_FDS > 0 ? 'systemd' : CONFIG.port);
app.set('views', '/');
app.set('view engine', 'ejs', { pretty: true });
app.use(favicon(__dirname + '/static/favicon.ico'));

// Temporary placeholder until new logging infrastructure implemented
if( process.env.ENABLE_EXPRESS_LOGS == 'true' )
{
  app.use(logger('dev'));
}

app.use('/components', express.static(path.join(__dirname, 'static/bower_components')));
app.use('/components', express.static(pluginFolder));
app.use('/components', express.static(path.join(__dirname, 'static/webcomponents')));
app.use('/components', express.static(path.join(__dirname, 'plugins/telemetry/public/bower_components')));
app.use('/components/telemetry', express.static(path.join(__dirname, 'plugins/telemetry/public/webcomponents')));
app.use('/components/telemetry', serveIndex(path.join(__dirname, 'plugins/telemetry/public/webcomponents')));

debug( '!!!' + path.join(__dirname, 'src/static/bower_components') );

app.get('/config.js', function (req, res) {
  res.type('application/javascript');
  res.send('var CONFIG = ' + JSON.stringify(CONFIG));
});
//socket.io cross domain access
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'X-Requested-With');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
  next();
});
// ---------------------------------------------------------------
// Keep track of plugins js and css to load them in the view
var scripts = [], styles = [], applets = [], sysscripts = [], webcomponents = [];
var pathInfo = function () {
  return {
    scripts: scripts,
    styles: styles,
    sysscripts: sysscripts,
    applets: applets,
    webcomponents: webcomponents
  };
};
// Prepare dependency map for plugins
var deps = {
    server: server,
    app: app,
    cockpit: client,
    config: CONFIG,
    globalEventLoop: globalEventLoop,
    loadedPlugins: [],
    pathInfo: pathInfo
  };
var numConnections = 0;
var socketConnectToken = null;
// Handle socket.io events
io.on('connection', function (client) {
  if (socketConnectToken == null) {
    socketConnectToken = client.id;
  }
  numConnections++;

  debug('HASTHEBALL:TRUE');

  client.hastheball = true;
  client.emit('hastheball', socketConnectToken);
  client.on('request-sessionToken', function (callback) {
    callback(socketConnectToken);  //TODO: On force, kill the other inbound connections
  });

  log('Connection detected');
  log('Current connections: ' + numConnections);

  client.on('disconnect', function () {
  });
});
io.use(function (socket, next) {
  log('Auth expecting %s. got %s', socketConnectToken == null ? '<NULL>' : socketConnectToken, socket.handshake.query.token == undefined ? '<UNDEFINED>' : socket.handshake.query.token);
  
  // return the result of next() to accept the connection.
  if (socketConnectToken == null || socketConnectToken == socket.handshake.query.token || socket.handshake.query.token == 'reset') {
    if (socket.handshake.query.token == 'reset') {
      socketConnectToken = null;
      //And kick anyone already connected
      //   if (typeof(io.sockets.server.eio.clients) == 'Array'){
      var socketCollection = io.sockets.connected;
      Object.keys(socketCollection).forEach(function (key) {
        var client = socketCollection[key];
        if (client.id !== socket.id) {
          log('kicking out:', client.id);
          setTimeout(function () {
            client.emit('forced-disconnect');
            client.disconnect();
          }, 1000);
        }
      });  //  }
    }
    return next();
  }
  // call next() with an Error if you need to reject the connection.
  next(new Error('Authentication error'));
});
deps.cockpit.on('disconnect', function () {
  numConnections--;
  if (numConnections == 0) {
    socketConnectToken = null;
  }
  log('Disconnect detected');
  log('Current connections: ' + numConnections);
});
// Handle global events
deps.globalEventLoop.on('mcu.rovsys', function (data) {
  deps.cockpit.emit('mcu.rovsys', data);
});
// -----------------------------------------------------------------------
// Load Plugins
// -----------------------------------------------------------------------
mkdirp.sync(pluginFolder);

var options={
  cacheFile:path.join(cacheFolder,'cachedLoadPluginsResults_systemPlugins.json'),
  required:true
}
var loaderA = new PluginLoader(path.join(__dirname, 'system-plugins'), 'system-plugin', deps, options);

options.cacheFile=path.join(cacheFolder,'cachedLoadPluginsResults_plugins.json');
var loaderB = new PluginLoader(path.join(__dirname, 'plugins'), 'plugin', deps,options);

options.required=false;
options.filter = function (file) {
      return file.substring(0, 15) === 'openrov-plugin-';
    }
options.cacheFile=path.join(cacheFolder,'cachedLoadPluginsResults_community.json');    
var loaderC = new PluginLoader(pluginFolder, 'community-plugin', deps,options );


// Performance optimization, attempt to read from a cache of the plugins instead, fallback
// if not available.

var plugins = [];

loaderA.loadPluginsAsync(plugins)
.then( loaderB.loadPluginsAsync.bind( loaderB ) )
.then( loaderC.loadPluginsAsync.bind( loaderC ) )
.each(function(results)
{
    addPluginAssets(results);
})
.then(function () 
{
  debug('Starting following plugins:');
  debug(deps.loadedPlugins);

  // Start each plugin
  deps.loadedPlugins.forEach(function (plugin) 
  {
    if (plugin.start !== undefined) 
    {
      plugin.start();
    }
  });
})
.then(function () 
{
  debug('Plugin loading successful!');

  // Start the web server
  server.listen(app.get('port'), function () 
  {
    log('Started listening on port: ' + app.get('port'));
  });
})
.catch(function (err)
{
  error('Error starting plugins: ' + err.message);
  error('Stack trace: ' + err.stack);
  process.abort();
});

// Helper function
function addPluginAssets(result) {
  scripts = scripts.concat(result.scripts);

  debug('====== Scripts ======');
  debug(result.scripts);

  result.scripts.forEach(function (asset) 
  {
    debug('SCRIPT: ' + asset);
  });

  styles = styles.concat(result.styles);

  webcomponents = webcomponents.concat(result.webcomponents);

  result.assets.forEach(function (asset) 
  {
    debug('TEST: ' + asset.path);
    debug( JSON.stringify( asset ) );
    app.use('/' + asset.path, express.static(asset.assets));
  });

  applets = applets.concat(result.applets);

  if (result.plugins !== undefined) 
  {
    deps.loadedPlugins = deps.loadedPlugins.concat(result.plugins);
  }
}  // ------------------------------------------------------------------------
