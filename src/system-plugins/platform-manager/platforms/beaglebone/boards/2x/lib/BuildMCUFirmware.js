var ArduinoBuilder  = require('/opt/openrov/cockpit/src/lib/ArduinoBuilder.js');

var opts = 
{
    sketchDir: '/opt/openrov/firmware/sketches/OpenROV2x',
    installBaseDir: '/opt/openrov/firmware/bin',
    productID: '2x',
    cleanAfterBuild: true,
    fqbn: 'openrov:avr:mega:cpu=atmega2560',
    hardware: '/opt/openrov/arduino/hardware',
    tools: '/opt/openrov/arduino/hardware/tools',
    warnings: 'all',
    verbose: true,
    quiet: false,
    debug: 5,
    libs:     [
                '/opt/openrov/arduino/hardware/openrov/avr/libraries',
                '/opt/openrov/firmware/libraries'
              ],
    preproc:  [ 
                "MCUARCH_AVR=1",
                "ENABLE_I2C_DEBUG=1"
              ],
    generateCode: true
};

function Build( onStdout, onStderr ) 
{
  return ArduinoBuilder.BuildSketch( opts, onStdout, onStderr );
}

module.exports = Build;