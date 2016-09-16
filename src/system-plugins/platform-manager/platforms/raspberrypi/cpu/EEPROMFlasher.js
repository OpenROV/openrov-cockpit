var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));
var path = require('path');
var EEPROMFlasher = function (productId, revision) {
  var pinoutPath = path.resolve(path.join(__dirname, '../boards', productId, 'eeprom/pinout.json'));
  // Read pinout file
  return fs.readFileAsync(pinoutPath).then(function (data) {
    // Open the eeprom file handle
    return fs.openAsync('/sys/class/i2c-adapter/i2c-1/1-0054/eeprom', 'w').then(function (fd) {
      // Convert pinout json data into binary block
      var jsonString = data;
      var jsonBuffer = new Buffer(jsonString, 'utf8');
      var len = jsonBuffer.length;
      var lengthBuffer = new Buffer(4);
      lengthBuffer.writeUInt32LE(len);
      var output = Buffer.concat([
          lengthBuffer,
          jsonBuffer
        ]);
      // Write binary block to eeprom
      return fs.writeAsync(fd, output, 0, output.length).then(function () {
        // Close eeprom file handle	
        return fs.closeAsync(fd);
      });
    });
  });
};
module.exports = EEPROMFlasher;