(function (window, $, undefined) {
  'use strict';

  var PluginFinder = function PluginFinder(cockpit) {
    console.log('Loading Plugin Finder plugin.');
    this.cockpit = cockpit;
    var self = this;
    this.cachedAvailablePlugins = [];
    var configManager = new window.Plugins.PluginFinder.Config();
    this.primeCache();
  };

  PluginFinder.prototype.listen = function listen(){
    var self = this;
    this.cockpit.on('plugin-finder.query',function(query,fn){
      self.query(query, function(results){
        if (fn!== undefined){
          fn(results);
        }
      });
    });
    this.cockpit.on('plugin-finder.install',function(plugin,fn){
      self.installPlugin(plugin,fn);
    });
    this.cockpit.on('plugin-finder.uninstall',function(plugin,fn){
      self.uninstallPlugin(plugin,fn);
    });
    this.cockpit.on('plugin-finder.open-details',function(plugin){
      window.open('http://bower.io/search/?q='+plugin,'bowerInfo');
    });

    this.cockpit.rov.on('plugin.pluginFinder.installStatus', function(status){
      console.log(status);
    });

    this.cockpit.rov.on('plugin.pluginFinder.restartRequired', function(){
      alert('Plugin Installed, you will need to refresh the browser to load the plugin. ');
    });

  };

  PluginFinder.prototype.primeCache = function primeCache(){
    var self = this;
    this.cockpit.rov.emit('plugin.pluginFinder.search','',function(results){

  //  this.cockpit.rov.socket.emit('plugin.pluginFinder.search','',function(results){
      self.cachedAvailablePlugins = [];
      results.forEach(function (plugin) {
        var p =  {
                    name: plugin.name.replace('openrov-plugin-',''),
                    description: '',
                    config: {},
                    isEnabled: true,
                    homepage: '',
                    description: '',
                    raiting: '',
                    installed: plugin.InstalledOnROV === true ? true : false,
                    rawPlugin: plugin,
                  };


        self.cachedAvailablePlugins.push(p);

        var giturl = plugin
          .url
          .replace('.git','')
          .replace('git://github.com/','https://api.github.com/repos/');

        $.getJSON( giturl, function( data ) {
          p.description = data.description;
          p.raiting = data.stargazers_count;
          p.homepage = data.homepage !== null ? data.homepage : data.html_url;
        });
      });
    });
  }

  PluginFinder.prototype.query = function query(q,callback){

    callback(
      this.cachedAvailablePlugins.filter(
        function(item){
          //query is bound to this http://stackoverflow.com/a/13755750
          return (item.name.toLowerCase().indexOf(this.toLowerCase()) >= 0)
        },q)
    );

  };

  PluginFinder.prototype.installPlugin = function installPlugin(pluginName,callback){
    self.cockpit.rov.emit('plugin.pluginFinder.install',pluginName,function(){
      callback();
    });

  };

  PluginFinder.prototype.installPlugin = function uninstallPlugin(pluginName,callback){
    self.cockpit.rov.emit('plugin.pluginFinder.uninstall',pluginName,function(){
      callback();
    });

  };

  window.Cockpit.plugins.push(PluginFinder);
}(window, jQuery));
