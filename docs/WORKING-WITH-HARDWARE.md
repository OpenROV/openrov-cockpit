** Flashing the MCU **
```
sudo node /opt/openrov/system/scripts/BuildFirmware.js
sudo node /opt/openrov/system/scripts/FlashFirmware.js
```

** Flash the MCU if the board ID EEPROM is not been programmed already **
```
node /opt/openrov/cockpit/src/system-plugins/platform-manager/platforms/raspberrypi/boards/trident_alpha/install/files/BuildFirmware.js
node /opt/openrov/cockpit/src/system-plugins/platform-manager/platforms/raspberrypi/boards/
trident_alpha/install/files/FlashFirmware.js
```

** Flashing the EEPROM (Trident) **
Add the following to a js file and run it.
```
var flasher = require('src/system-plugins/platform-manager/platforms/raspberrypi/cpu/EEPROMFlasher.js');

flasher( 'trident_alpha', '0001' )
.then( function(){ console.log( "yay" ); }  )
.catch( function( err ){ console.log( "uh oh: " + err.message ); } );
```

** Manually confirm Raspi can talke to MCU over serail **
```
picocom -b 115200 /dev/ttyAMA0
```

** Force the I2C to come up to read the EEPROM **
```
modprobe i2c-bcm2708
modprobe i2c-dev
modprobe at24

echo "24c256 0x54" > /sys/class/i2c-adapter/i2c-1/new_device

cat /sys/class/i2c-adapter/i2c-1/1-0054/eeprom

```