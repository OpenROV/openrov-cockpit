const Promise = require( 'bluebird' );
const fs      = Promise.promisifyAll( require( 'fs' ) );
const path    = require( 'path' );

var EEPROMFlasher = ( boardID ) => 
{
    var boardInfoPath = path.resolve( path.join( __dirname, '../boards', boardID, 'eeprom.json' ) );

    // Read board info file
    return fs.readFileAsync( boardInfoPath )
        .then( ( data ) =>
        {
            // Open the eeprom file handle
            return fs.openAsync('/sys/class/i2c-adapter/i2c-1/1-0054/eeprom', 'w')
                .then( ( fd ) => 
                {
                    // Convert pinout json data into binary block
                    var jsonString    = data;
                    var jsonBuffer    = new Buffer( jsonString, 'utf8' );
                    var len           = jsonBuffer.length;
                    var lengthBuffer  = new Buffer( 4 );

                    // Write the length of the json data block
                    lengthBuffer.writeUInt32LE( len );

                    // Concat the length and json data into one buffer
                    var output = Buffer.concat( [ lengthBuffer, jsonBuffer ] );

                    // Write binary block to eeprom
                    return fs.writeAsync( fd, output, 0, output.length )
                        .then( () => 
                        {
                            // Close eeprom file handle	
                            return fs.closeAsync( fd );
                        });
                });
        });
};

module.exports = EEPROMFlasher;