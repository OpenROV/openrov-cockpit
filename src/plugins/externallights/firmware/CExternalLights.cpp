#include "SysConfig.h"
#if(HAS_EXT_LIGHTS && CONTROLLERBOARD == CONTROLLERBOARD_CB25 )

// Includes
#include <Arduino.h>
#include "CExternalLights.h"
#include "CPin.h"

// Set pin definitions
#define ELIGHTS0_PIN 46
#define ELIGHTS1_PIN 12

namespace
{
    CPin elight0("elight0", ELIGHTS0_PIN, CPin::kAnalog, CPin::kOutput);
    CPin elight1("elight1", ELIGHTS1_PIN, CPin::kAnalog, CPin::kOutput);
}

void CExternalLights::Initialize()
{
    elight0.Reset();
    elight0.Write(0);
    
    elight1.Reset();
    elight1.Write(0);
}

void CExternalLights::Update( CCommand& commandIn )
{
    if( commandIn.Equals( "elight0" ) )
	{
		// Should be between 0-255, with 255 being full brightness
		int value = commandIn.m_arguments[1];

		// Bounds corrections
		if( value < 0 )
		{
			value = 0;
		}
		if( value > 255 )
		{
			value = 255;
		}
		
		elight0.Write( value );
		
		Serial.print( F( "LIGTE0:" ) );
		Serial.print( value );
		Serial.print( ';' );
		
		Serial.print( F( "LIGPE0:" ) );
		Serial.print( value );
		Serial.println( ';' );
	}
    
    // Handle messages
	if( commandIn.Equals( "elight1" ) )
	{
		// Should be between 0-255, with 255 being full brightness
		int value = commandIn.m_arguments[1];

		// Bounds corrections
		if( value < 0 )
		{
			value = 0;
		}
		if( value > 255 )
		{
			value = 255;
		}
		
		elight1.Write( value );
		
		Serial.print( F( "LIGTE1:" ) );
		Serial.print( value );
		Serial.print( ';' );
		
		Serial.print( F( "LIGPE1:" ) );
		Serial.print( value );
		Serial.println( ';' );
	}
}

#endif
