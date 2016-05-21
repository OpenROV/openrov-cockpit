(function() {
  function wifiLights(name, deps) {
    console.log('Wifi Lights plugin loaded');
    var wifilights = 0;
   
    // Cockpit
    deps.cockpit.on('plugin.wifilights.adjust', function (value) {
      adjustLights(value);
    });

    deps.cockpit.on('plugin.wifilights.set', function (value) {
      setLights(value);
    });

    var adjustLights = function (value) {
      if (wifilights === 0 && value < 0) {
        wifilights = 0;
      } else if (wifilights == 1 && value > 0) {
        wifilights = 1;
      } else {
        wifilights += value;
      }
      setLights(wifilights);
    };

    var setLights = function (value) 
    {
      wifilights = value;
      if (wifilights >= 1){
        wifilights = 1;
      }
      
      if (wifilights <= 0){
        wifilights = 0;
      }
      var val = wifilights*100;
      var request = require('request');
      var options = {	url: 'http://192.168.1.91',//change to ESP's IP address
			  method: 'POST',
			  headers: {'Val': val}
      };

      request(options,function(error,response,body)
      {
		    if(!error){
          var json=JSON.stringify({level:body})
          json = JSON.parse(json);
          deps.cockpit.emit('plugin.wifilights.state',json);
          console.log('Server responded with:',body);}
		    else if(error){
			    console.error('ERROR:',error);}
      });
	
    };

  }
  module.exports = function (name, deps) {
    return new wifiLights(name,deps);
  };

})();
