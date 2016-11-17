(function (window, document, jQuery) 
{
  'use strict';

  var MjpegVideo;

  // Register plugin
  var plugins = namespace('plugins');
  plugins.MjpegVideo = MjpegVideo;

  MjpegVideo = function MjpegVideo(cockpit) 
  {
    console.log('Loading MjpegVideo plugin in the browser.');

    var self = this;
    this.cockpit = cockpit;
    this.rov = cockpit.rov;

    this.pluginDefaults = 
    {
      name: 'MjpegVideo',
      viewName: 'MjpegVideo plugin',
      canBeDisabled: false,
      defaultEnabled: true
    };

    this.cockpit.on( "plugin.mjpegVideo.scanForCameras", () =>
    {
      this.rov.emit( "plugin.mjpegVideo.scanForCameras" );
    })
  };

  MjpegVideo.prototype.inputDefaults = function inputDefaults() 
  {
    var self = this;
    return [];
  };

  window.Cockpit.plugins.push(MjpegVideo);
}(window, document, $));