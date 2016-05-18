// Regex expressions for getting function parameters
var STRIP_COMMENTS 	= /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
var ARGUMENT_NAMES 	= /([^\s,]+)/g;

function Interface( interfaceName, deps ) 
{
	var self = this;
	
	this.interface 		= interfaceName;
	this.global			= deps.globalEventLoop;
	this.cockpit 		= deps.cockpit;
	this.vehicleConfig	= deps.config;
	this.functions 		= {};
};

// TODO: Use ES6 default parameter for isDefault
Interface.prototype.AddMethod = function( name, func, isDefault )
{
	// Remove prior listener, if it exists
	if( this.functions[ name ] !== undefined )
	{
		this.global.removeListener( this.interface + "." + name, this.functions[ name ] );
	}
	
	// TODO: Use symbols instead of property names
	func.oName = name;
	func.oIsDefault = isDefault;
	
	this.functions[ name ] = func;
	
	// Add new listener
	this.global.on( this.interface + "." + name, this.functions[ name ] );
}

// Creates a JSON string with function API
Interface.prototype.SerializeAPI = function()
{
	var self = this;
	
	var api = {};
	var functions = [];
	
	// Fill function array
	for( var prop in self.functions )
	{
		var obj = {};
		obj[ prop ] = GetParamNames( self.functions[ prop ] );
		functions.push( obj );
	}
	
	api[ "functions" ] = functions;
	
	// Return API as JSON object
	return JSON.stringify( api );
}

// Returns an array with the names of a functions parameters
function GetParamNames( func ) 
{
  var fnStr = func.toString().replace(STRIP_COMMENTS, '');
  var result = fnStr.slice(fnStr.indexOf('(')+1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
  
  if( result === null )
  {
     result = [];
  }
  
  return result;
}

module.exports = Interface;
