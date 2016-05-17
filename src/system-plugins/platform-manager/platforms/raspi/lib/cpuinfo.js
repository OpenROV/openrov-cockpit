var q = require( "q" );
var pspawn = require( "./pspawn.js" );

var getCpuInfo = function()
{
	return pspawn( "cat", ["/proc/cpuinfo"] )
	.then( function( data ) 
	{
			var result = {};
			var all = [];
			
			// Loop through each line in the output
			data.toString().split('\n').forEach(function (line) 
			{
					// Remove tabs from line
					line=line.replace(/\t/g, '');

					// Split into field:value parts
					var parts = line.split(':');
					
					// If there are two parts, it has valid data
					if (parts.length === 2) 
					{
							var fieldName 	= parts[0].replace(/\s/g, '_');		// Replace spaces with underscore
							var value 		= parts[1].trim();
							
							result[ fieldName ] = value;
					}
			});
			
			return result;
	} );  
};

module.exports = getCpuInfo;
