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
if (process.env['NODE_PATH']!==undefined)
{
    oldpath = process.env['NODE_PATH'];
}

// Just in case already been set, leave it alone
process.env['NODE_PATH'] = ( __dirname + '/lib:' + oldpath );
require('module').Module._initPaths();
console.log( "Set NODE_PATH to: " + process.env['NODE_PATH'] );

// Handle linux signals
if (process.platform === 'linux') 
{
 process.on('SIGTERM', function () 
 {
   console.error('got SIGTERM, shutting down...');
   process.exit(0);
 });
 
 process.on('SIGINT', function () 
 {
   console.error('got SIGINT, shutting down...');
   process.exit(0);
 });
}

require('systemd');
var CONFIG              = require('./lib/config');
var fs                  = require('fs');
var express             = require('express');
var app                 = express();
var server              = require('http').createServer(app);
var io                  = require('socket.io').listen(server, { log: false, origins: '*:*', path:'/cockpitsocket' });
var EventEmitter        = require('events').EventEmitter;
var EventEmitter2       = require('eventemitter2').EventEmitter2;
var logger              = require('./lib/logger').create(CONFIG);
var mkdirp              = require('mkdirp');
var path                = require('path');
var PluginLoader        = require('./lib/PluginLoader');
var CockpitMessaging    = require('./lib/CockpitMessaging');
var Q                   = require('q');
var serveIndex          = require('serve-index');
var favicon             = require('serve-favicon');
var logger              = require('morgan');
var methodOverride      = require('method-override');
var session             = require('express-session');
var bodyParser          = require('body-parser');
var multer              = require('multer');
var errorHandler        = require('errorhandler');

var pluginFolder        = CONFIG.preferences.get('pluginsDownloadDirectory');

// Setup required directories
mkdirp(CONFIG.preferences.get('photoDirectory'));
process.env.NODE_ENV    = true;
var globalEventLoop     = require('./static/js/eventEmitterStoreAndForward.js')(new EventEmitter2());
var DELAY               = Math.round(1000 / CONFIG.video_frame_rate);
io                      = require('./static/js/socketIOStoreAndForward.js')(io);
var client              = new CockpitMessaging(io);
client                  = require('./static/js/eventEmitterStoreAndForward.js')(client);


// ---------------------------------------------------------------
// Setup Express App
// ---------------------------------------------------------------
app.use(express.static(__dirname + '/static/'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('port', process.env.LISTEN_FDS > 0 ? 'systemd' : CONFIG.port);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs', { pretty: true });
app.use(favicon(__dirname + '/static/favicon.ico'));
app.use(logger('dev'));
app.use('/components', express.static(path.join(__dirname, 'static/bower_components')));
app.use('/components', express.static(pluginFolder));
app.use('/components', express.static(path.join(__dirname, 'static/webcomponents')));
app.use('/components', express.static(path.join(__dirname,'plugins/telemetry/public/bower_components')));
app.use('/components/telemetry', express.static(path.join(__dirname,'plugins/telemetry/public/webcomponents')));
app.use('/components/telemetry', serveIndex(path.join(__dirname,'plugins/telemetry/public/webcomponents')));

console.log("!!!"+ path.join(__dirname, 'src/static/bower_components'));

app.get('/config.js', function (req, res) 
{
    res.type('application/javascript');
    res.send('var CONFIG = ' + JSON.stringify(CONFIG));
});

//socket.io cross domain access
app.use(function (req, res, next) 
{
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
    next();
});
// ---------------------------------------------------------------

// Keep track of plugins js and css to load them in the view
var scripts = [],
    styles = [],
    applets = [],
    sysscripts = [];
    
var pathInfo = function()
{
    return {
        scripts: scripts,
        styles: styles,
        sysscripts: sysscripts,
        applets: applets
    }
}

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

// Handle socket.io events
deps.cockpit.on('connect', function () 
{
    numConnections++;
    console.log('Connection detected');
    console.log('Current connections: ' + numConnections );
});

deps.cockpit.on('disconnect', function () 
{
    numConnections--;
    console.log('Disconnect detected');
    console.log('Current connections: ' + numConnections );
});

// Handle global events
deps.globalEventLoop.on( 'mcu.rovsys', function( data ) 
{
    deps.cockpit.emit( 'mcu.rovsys', data );
} );


// -----------------------------------------------------------------------
// Load Plugins
// -----------------------------------------------------------------------
var loader = new PluginLoader();

mkdirp.sync(pluginFolder);

var funcs = [
 loader.loadPlugins(path.join(__dirname, 'system-plugins'), 'system-plugin', deps),
 loader.loadPlugins(path.join(__dirname, 'plugins'), 'plugin', deps),
 loader.loadPlugins(pluginFolder, 'community-plugin', deps, function (file) 
 {
   return file.substring(0, 15) === 'openrov-plugin-';
 } )
]

Q.allSettled(funcs).then(function(results)
{
    // Get plugin assets
    results.forEach(function (result) 
    {
        if (result.state === "fulfilled") 
        {
            var value = result.value;
            addPluginAssets(value);
        }
        else 
        {
            var reason = result.reason;
            console.error(reason);
        }
    });

    console.warn("Starting following plugins:");
    console.dir(deps.loadedPlugins);

    // Start each plugin
    deps.loadedPlugins.forEach(function(plugin)
    {
        if (plugin.start !== undefined)
        {
            plugin.start();
        }
    });

}).fail(function (error) 
{
    console.log("Error starting plugins:");
    
    if( error !== undefined )
    {
        console.dir(error);
    }
    
    throw new Error("Error in loading plugins");
})

// Helper function
function addPluginAssets(result) 
{
    scripts = scripts.concat(result.scripts);

    console.log("====== Scripts ======")
    console.dir(result.scripts);

    result.scripts.forEach(function (asset) 
    {
        console.log("SCRIPT: " + asset);
    });

    styles = styles.concat(result.styles);

    result.assets.forEach(function (asset) 
    {
        console.log("TEST: " + asset.path);
        console.dir(asset);
        app.use('/' + asset.path, express.static(asset.assets));
    });

    applets = applets.concat(result.applets)

    if (result.plugins !== undefined)
    {
        deps.loadedPlugins=deps.loadedPlugins.concat(result.plugins);
    }
}
// ------------------------------------------------------------------------

// Start the web server
server.listen( app.get('port'), function() 
{
    console.log('Started listening on port: ' + app.get('port'));
});



