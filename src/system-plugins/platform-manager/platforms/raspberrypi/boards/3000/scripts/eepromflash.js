var fs 		= require("fs");



fs.readFile( "./board.json", function( err, data  )
{	
	fs.open( "/sys/class/i2c-adapter/i2c-1/1-0054/eeprom", 'w', function( err, fd )
	{
		var jsonString =  data;
		var jsonBuffer = new Buffer( jsonString, 'utf8' );
		
		var len = jsonBuffer.length;
		
		var lengthBuffer = new Buffer( 4 );
		lengthBuffer.writeUInt32LE( len );
		
		var output = Buffer.concat( [ lengthBuffer, jsonBuffer ] );
		
		console.log( "len: " + len );
		console.log( "lenghtBuffer: " + lengthBuffer.toString('hex') );
		
		fs.write( fd, output, 0, output.length, function()
		{			
			fs.close(fd, function()
			{
				console.log('file closed');
			});
		});
	} );
} );




