(function (window, $, undefined) {
  'use strict';
  var HeadsUpMenu;
  HeadsUpMenu = function HeadsUpMenu(cockpit) {
    console.log('Loading HeadsUpMenu plugin in the browser.');
    var self = this;

    self.cockpit = cockpit;
    this.menuItems = [];


    var enablePlugin = function() {
    };

    var disablePlugin = function() {
    };

    // for plugin management:
    this.name = 'headsup-menu'; // for the settings
    this.viewName = 'Heads up menu'; // for the UI
    this.canBeDisabled = true;
    this.enable = function() { enablePlugin(); };
    this.disable = function() { disablePlugin(); };

    enablePlugin();
  };

//TODO: Needs to be reworked
  HeadsUpMenu.prototype.inputDefaults_ = function inputDefaults(){
    return [
      {
        name: 'headsupMenu.show',
        description: 'Show the heads up menu.',
        defaults: { keyboard: 'e', gamepad: 'START' },
        down: function () {
//          headsUpMenu.show();
        },
//        up: executeMenuItem,
        secondary: [
          {
            name: 'headsupMenu.next',
            description: 'select the next element of the heads up menu',
            defaults: { keyboard: 'c', gamepad: 'DPAD_DOWN' },
//            down: moveSelectionNext
          },
          {
            name: 'headsupMenu.prev',
            description: 'select the previous element of the heads up menu',
            defaults: { keyboard: 'd', gamepad: 'DPAD_UP' },
//            down: moveSelectionPrev
          }
        ]
      }
    ]
  };

  HeadsUpMenu.prototype.listen = function listen(){
    var self = this;
    this.cockpit.on('plugin.headsupmenu.register',function(menuItem){
      self.register(menuItem);
    });

    this.cockpit.on('plugin.heasup-menu.getMenuItems', function(callback){
      callback(self.menuItems);
    });

    /* Crawl the plugins looking for those with settings definitions */
    this.cockpit.loadedPlugins.forEach(function(plugin){
      if (plugin.altMenuDefaults !== undefined){
        if (typeof(plugin.altMenuDefaults) == 'function'){
          self.register(plugin.altMenuDefaults());
        }else {
          self.register(plugin.altMenuDefaults);
        }
      }
    });

  }

  HeadsUpMenu.prototype.register = function (item) {
    var self = this;
    var items = [].concat(item); // item can be a single object or an array
    items.forEach(function (anItem) {
      if (anItem.type === undefined) {
        anItem.type = 'button';
      }
      self.menuItems.push(anItem);
    });
  };


  window.Cockpit.plugins.push(HeadsUpMenu);
}(window, jQuery));
