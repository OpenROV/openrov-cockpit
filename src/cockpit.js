/*
 *
 * Description:
 * This script is the Node.js server for OpenROV.  It creates a server and instantiates an OpenROV
 * and sets the interval to grab frames.  The interval is set with the DELAY variable which is in
 * milliseconds.
 *
 */

//To eliminate hard coding paths for require, we are modifying the NODE_PATH to include
//out lib folder
if (process.env['NODE_PATH']===undefined){ //just in case already been set leave it alone
  process.env['NODE_PATH']=__dirname+'/lib';
  require('module').Module._initPaths();
  console.log("Set NODE_PATH to: "+process.env['NODE_PATH'] );
}

var CONFIG = require('./lib/config'), fs = require('fs'), express = require('express'), app = express(), server = require('http').createServer(app), io = require('socket.io').listen(server, { log: false, origins: '*:*' }), EventEmitter = require('events').EventEmitter, OpenROVCamera = require(CONFIG.OpenROVCamera), OpenROVController = require(CONFIG.OpenROVController), logger = require('./lib/logger').create(CONFIG), mkdirp = require('mkdirp'), path = require('path');
var PluginLoader = require('./lib/PluginLoader');
var CockpitMessaging = require('./lib/CockpitMessaging');
var Q=require('q');
require('systemd');
app.configure(function () {
  app.use(express.static(__dirname + '/static/'));
  app.use(express.json());
  app.use(express.urlencoded());
  app.use('/photos', express.directory(CONFIG.preferences.get('photoDirectory')));
  app.use('/photos', express.static(CONFIG.preferences.get('photoDirectory')));
  app.set('port', process.env.LISTEN_FDS > 0 ? 'systemd' : CONFIG.port);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs', { pretty: true });
  app.use(express.favicon(__dirname + '/static/favicon.icon'));
  app.use(express.logger('dev'));
  app.use(app.router);
  app.use('/components', express.static(path.join(__dirname, 'static/bower_components')));
  app.use('/components', express.static('/usr/share/cockpit/bower_components'));
  app.use('/components', express.static(path.join(__dirname, 'static/webcomponents')));

  app.use('/components', express.static(path.join(__dirname,'plugins/telemetry/public/bower_components')));
  app.use('/components/telemetry', express.static(path.join(__dirname,'plugins/telemetry/public/webcomponents')));
  app.use('/components/telemetry', express.directory(path.join(__dirname,'plugins/telemetry/public/webcomponents')));
  console.log("!!!"+ path.join(__dirname, 'src/static/bower_components'));
});
// Keep track of plugins js and css to load them in the view
var scripts = [], styles = [];
// setup required directories
mkdirp(CONFIG.preferences.get('photoDirectory'));
process.env.NODE_ENV = true;
var globalEventLoop = new EventEmitter();
var DELAY = Math.round(1000 / CONFIG.video_frame_rate);
var camera = new OpenROVCamera({ delay: DELAY });
io= require('./static/js/socketIOStoreAndForward.js')(io);
var client = new CockpitMessaging(io);
client = require('./static/js/eventEmitterStoreAndForward.js')(client);
var controller = new OpenROVController(globalEventLoop, client);

// Prepare dependency map for plugins
var deps = {
  server: server,
  app: app,
  rov: controller,
  camera: camera,
  cockpit: client,
  config: CONFIG,
  globalEventLoop: globalEventLoop,
  loadedPlugins: []
};

app.get('/config.js', function (req, res) {
  res.type('application/javascript');
  res.send('var CONFIG = ' + JSON.stringify(CONFIG));
});
app.get('/', function (req, res) {
  var viewname = CONFIG.preferences.get("plugins:ui-manager").selectedUI;
  viewname = viewname === undefined ? "new-ui" : viewname;
  var view =  __dirname + '/plugins/'+viewname+'/index.ejs';
  res.render(view, {
    title: 'OpenROV Cockpit',
    scripts: scripts,
    styles: styles,
    sysscripts: sysscripts,
    config: CONFIG
  });
});
//socket.io cross domain access
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'X-Requested-With');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
  next();
});
var connections = 0;
// SOCKET connection ==============================
connections += 1;
if (connections == 1)
  controller.start();
// opens socket with client
if (camera.IsCapturing) {
  deps.cockpit.emit('videoStarted');
  console.log('Send videoStarted to client 2');
} else {
  console.log('Trying to restart mjpeg streamer');
  camera.capture();
  deps.cockpit.emit('videoStarted');
}
deps.cockpit.on('videoStatus', function(clk) {
  clk(camera.IsCapturing);
});

deps.cockpit.emit('settings', CONFIG.preferences.get());

deps.cockpit.on('update_settings', function (value) {
  for (var property in value)
    if (value.hasOwnProperty(property))
      CONFIG.preferences.set(property, value[property]);
  CONFIG.savePreferences();
  controller.updateSetting();
  setTimeout(function () {
    controller.requestSettings();
  }, 1000);
});
deps.cockpit.on('disconnect', function () {
  connections -= 1;
  console.log('disconnect detected');
  if (connections === 0)
    controller.stop();
});
controller.on('rovsys', function (data) {
  deps.cockpit.emit('rovsys', data);
});
controller.on('Arduino-settings-reported', function (settings) {
  deps.cockpit.emit('settings', settings);
//  console.log('sending arduino settings to web client');
});
controller.on('settings-updated', function (settings) {
  deps.cockpit.emit('settings', settings);
//  console.log('sending settings to web client');
});
globalEventLoop.on('videoStarted', function () {
  deps.cockpit.emit('videoStarted');
  console.log('sent videoStarted to client');
});
globalEventLoop.on('videoStopped', function () {
  deps.cockpit.emit('videoStopped');
});

camera.on('started', function () {
  console.log('emitted \'videoStarted\'');
  globalEventLoop.emit('videoStarted');
});
camera.capture(function (err) {
  if (err) {
    connections -= 1;
    camera.close();
    return console.error('couldn\'t initialize camera. got:', err);
  }
});
camera.on('error.device', function (err) {
  console.log('camera emitted an error:', err);
  globalEventLoop.emit('videoStopped');
});
if (process.platform === 'linux') {
  process.on('SIGTERM', function () {
    console.error('got SIGTERM, shutting down...');
    camera.close();
    process.exit(0);
  });
  process.on('SIGINT', function () {
    console.error('got SIGINT, shutting down...');
    camera.close();
    process.exit(0);
  });
}

// Load the plugins
function addPluginAssets(result) {
  scripts = scripts.concat(result.scripts);
  console.log("====== Scripts ======")
  console.dir(result.scripts);
  result.scripts.forEach(function (asset) {
    console.log("SCRIPT: " + asset);
  });
  styles = styles.concat(result.styles);
  result.assets.forEach(function (asset) {
    console.log("TEST: " + asset.path);
    console.dir(asset);
    app.use('/' + asset.path, express.static(asset.assets));
  });
  if (result.plugins !== undefined){
    deps.loadedPlugins=deps.loadedPlugins.concat(result.plugins);
  }
}
var loader = new PluginLoader();

/*Order does matter in the script loading below*/
var sysscripts = [];

/*
var sysscripts = ["bogus",
          "js/libs/eventemitter2.js",
           "bower_components/jquery/dist/jquery.min.js",
           "bower_components/jquery-ui//jquery-ui.min.js",
           "js/libs/bootstrap.min.js",
           "js/libs/mousetrap.min.js",
           'bower_components/knockoutjs/dist/knockout.js',
           "bower_components/knockout.validation/Dist/knockout.validation.js",
           'js/knockout-extentions.js',
           'js/libs/db.js',
           "js/libs/IndexedDBShim.min.js",
           "config.js",
           "socket.io/socket.io.js",
           'js/libs/gamepad.js',
           'js/utilities.js',
           'js/message-manager.js',
    //       'js/ui-loader.js',
           "js/cockpit.js",
           'js/app.js'
         ];
*/
//
//            "bower_components/webcomponentsjs/webcomponents.min.js",
mkdirp.sync('/usr/share/cockpit/bower_components');

var funcs = [
//  loader.loadPlugins(path.join(__dirname, 'ui-plugins'), 'ui-plugin', deps),
  loader.loadPlugins(path.join(__dirname, 'system-plugins'), 'system-plugin', deps),
  loader.loadPlugins(path.join(__dirname, 'plugins'), 'plugin', deps),
  loader.loadPlugins('/usr/share/cockpit/bower_components', 'community-plugin', deps, function (file) {
    return file.substring(0, 15) === 'openrov-plugin-';
  })
]

Q.allSettled(funcs).then(function(results){
  results.forEach(function (result) {
    if (result.state === "fulfilled") {
        var value = result.value;
        addPluginAssets(value);
    } else {
        var reason = result.reason;
        console.error(reason);
        debugger;
    }
  });
  console.warn("Executing Now");
  console.dir(deps.loadedPlugins);

  deps.loadedPlugins.forEach(function(plugin){
    if (plugin.start !== undefined){
      plugin.start();
    }
  });
})
.fail(function (error) {
    console.log("Executing Error");
    if (error !== undefined){
      console.dir(error);
    }
    process.exit -1;
    throw new Error("Error in loading plugins");

//    console.log(error);
//    throw error;
})

controller.start();
// Start the web server
server.listen(app.get('port'), function () {
  console.log('Started listening on port: ' + app.get('port'));
});
