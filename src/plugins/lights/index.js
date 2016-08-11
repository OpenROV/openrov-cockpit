(function() {
  function Lights(name, deps) 
  {
    console.log('Lights plugin loaded');

    var self            = this;

    self.setting        = 0;

    //  Settings:       = [ 0 .. 5 ]
    self.levelMap        = [ 0, 48, 64, 96, 160, 255 ];
    self.maxLevel        = self.levelMap.length - 1;

    // Cockpit
    deps.cockpit.on('plugin.lights.toggle', function() 
    {
        toggleLights();
    });

    deps.cockpit.on('plugin.lights.adjust', function( value ) 
    {
        adjustLights( value );
    });

    deps.cockpit.on('plugin.lights.set', function( value ) 
    {
        setLights( value );
    });

    deps.cockpit.on('plugin.lights.setOnOff', function( setOn ) 
    {
        if( setOn )
        {
            // Max light power
            setLights( self.maxLevel );
        }
        else
        {
            // Min light power
            setLights( 0 );
        }
    });

    // Arduino
    deps.globalEventLoop.on( 'mcu.status', function (data) 
    {   
        if ('LIGT' in data) 
        {
            // Value of 0-255 representing percent
            var level = parseInt( data.LIGT );

            // Search for the level in the level map
            var setting = self.levelMap.indexOf( level );

            if( setting != -1 )
            {
                // The new setting value is the array index of the level in the level map, if it exists
                self.setting = setting;

                console.log( "A: " + self.setting );
            }
            else
            {
                // Find the closest level in our map
                var closest = self.levelMap.reduce( function (prev, curr) 
                {
                    return (Math.abs(curr - level) < Math.abs(prev - level) ? curr : prev);
                });
                
                // Set the new setting value based on the index of the closest level
                self.setting = self.levelMap.indexOf( closest );

                console.log( "B: " + self.setting );
            }

            deps.cockpit.emit( 'plugin.lights.state', { level: self.setting } );
        }
    });

     var adjustLights = function adjustLights( value ) 
    {
        // Modify current setting
        console.log( "C: " + ( self.setting + value ) );
        console.log( "D: " + value );

        setLights( self.setting + value );
    };

    var toggleLights = function toggleLights() 
    {
        if( self.setting > 0 ) 
        {
            // Set to min power
            setLights( 0 );
        } 
        else 
        {
            // Set to max power
            setLights( self.maxLevel );
        }
    };

    var setLights = function setLights( value ) 
    {
        console.log( "E: " + value );

        // Range limit the new setting from 0 to the max number of defined levels
        if( value < 0 )
        {
            value = 0;
        }
        else if( value >= self.maxLevel )
        {
            value = self.maxLevel;
        }
        
        // Make sure the new setting is an integer
        self.setting = Math.round( value );

        var command = 'ligt(' + self.levelMap[ self.setting ] + ')';

        console.log( "F: " + self.setting );

        deps.globalEventLoop.emit( 'mcu.SendCommand', command );
    };
  }

  module.exports = function (name, deps) 
  {
    return new Lights(name,deps);
  };

})();
