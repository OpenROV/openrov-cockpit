var fs 		= require("fs");

fs.readFile( "../../config/eepromMock.json", function( err, data  )
{	
	fs.open( "../../config/eepromMock.bin", 'w', function( err, fd )
	{
		var jsonString =  data;
		var jsonBuffer = new Buffer( jsonString, 'utf8' );
		
		// Get length of json buffer
		var len = jsonBuffer.length;
		
		// Create buffer with length in it
		var lengthBuffer = new Buffer( 4 );
		lengthBuffer.writeUInt32LE( len );
		
		// Combine length buffer and json buffer
		var output = Buffer.concat( [ lengthBuffer, jsonBuffer ] );
		
		// Write to binary file
		fs.write( fd, output, 0, output.length, function()
		{			
			fs.close(fd, function()
			{
			});
		});
	} );
} );




