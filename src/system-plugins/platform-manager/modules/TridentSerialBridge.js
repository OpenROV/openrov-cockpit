const crc           = require('crc');
const SerialPort    = require('serialport');
const Delimiter      = SerialPort.parsers.Delimiter;
const EventEmitter  = require('events').EventEmitter;
const logger        = require('AppFramework.js').logger;
class SerialBridge extends EventEmitter
{
  constructor( uartDevicePath, uartBaud )
  {
    super();

    this.uartDevicePath = uartDevicePath;
    this.uartBaud = uartBaud;
    this.emitRawSerial = false;
    this.serialConnected = false;
    this.serialPort = {};
  }

  connect()
  {
    this.serialPort = new SerialPort( this.uartDevicePath, 
    {
      baudRate: this.uartBaud,
      autoOpen: true
    });

    // All discrete firmware messages end with ';'
    var parser = this.serialPort.pipe( new Delimiter( { delimiter: ';' } ) );

    this.serialPort.on('open', () =>
    {
      this.serialConnected = true;
      logger.debug('Serial port opened!');
    });

    this.serialPort.on('error',(err) =>
    {
      logger.debug('Serial error',err)
    })

    this.serialPort.on('close', (data) =>
    {
      logger.debug('Serial port closed!');
      this.serialConnected = false;
    });

    parser.on('data', (data) =>
    {
      var status = this.parseStatus( data.toString('utf8' ) );

      // If valid status message received, emit status events
      if( status !== null )
      {
        this.emit('status', status);

        if( this.emitRawSerial ) 
        {
          this.emit('serial-recieved', data + '\n');
        }
      }
    });
  }

  close()
  {
    if( !this.serialConnected )
    {
      return;
    }

    this.serialConnected = false;

    //This code is a work around for a race condition in the serial port code https://github.com/voodootikigod/node-serialport/issues/241#issuecomment-43058353
    var sp = this.serialPort;

    this.serialPort.flush( (err) =>
    {
        this.serialPort.close( (err) => {} );
    });
  }

  write( command )
  {
    // Create buffer for crc+command
    let messagebuffer = new Buffer( command.length + 1 );

    // Calculate and write crc8
    messagebuffer[ 0 ] = crc.crc81wire(command);

    // Write command
    messagebuffer.write( command, 1, command.length, 'utf-8' );

    if( this.serialConnected ) 
    {
      this.serialPort.write( messagebuffer );

      if( this.emitRawSerial ) 
      {
        this.emit('serial-sent', command );
      }
    } 
    else
    {
      logger.debug('DID NOT SEND');
    }
  }

  parseStatus( rawStatus )
  {
    let parts   = rawStatus.trim().split( ':' );
    
    if( parts.length === 2 )
    {
      if( !isNaN( parts[ 1 ] ) )
      {
        let status = {};
        status[ parts[ 0 ] ] = parts[ 1 ];
        return status;
      }
      else
      {
        logger.warn( "NAN RESULT: " + parts[ 1 ] );
      }
    }

    return null;
  }

  isConnected()
  {
    return this.serialConnected;
  }

  startRawSerialData()
  {
    this.emitRawSerial = true;
  }

  stopRawSerialData()
  {
    this.emitRawSerial = false;
  }
}

module.exports = SerialBridge;