#include "../SysConfig.h"
#if(HAS_EXT_LIGHTS)

// Includes
#include <Arduino.h>
#include "CExternalLights.h"
#include "../CPin.h"
#include "../PinDefinitions.h"


#if CONTROLLERBOARD == CONTROLLERBOARD_CAPE
	#error "External lights not supported on cape"
	
#elif CONTROLLERBOARD == CONTROLLERBOARD_CB25

	// Set pin definitions
	#ifndef ELIGHTS0_PIN
		#define ELIGHTS0_PIN PIN_PWM_3
	#endif
	#ifndef ELIGHTS1_PIN
		#define ELIGHTS1_PIN PIN_PWM_4
	#endif
	
#elif CONTROLLERBOARD == CONTROLLERBOARD_TRIDENT
	#error "External lights not supported on Trident board"
#endif

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
		float percentValue = ( float )commandIn.m_arguments[1] / 100.0f;
		int value = (int)( 255.0f * percentValue );
		
		elight0.Write( value );
		
		Serial.print( F( "LIGTE0:" ) );
		Serial.print( value );
		Serial.print( ';' );
		
		Serial.print( F( "LIGPE0:" ) );
		Serial.print( percentValue );
		Serial.println( ';' );
	}
    
    // Handle messages
	if( commandIn.Equals( "elight1" ) )
	{
		// 0 - 255
		float percentValue = ( float )commandIn.m_arguments[1] / 100.0f; //0 - 255
		int value = (int)( 255.0f * percentValue );
		
		elight1.Write( value );

		Serial.print( F( "LIGTE1:" ) );
		Serial.print( value );
		Serial.print( ';' );

		Serial.print( F( "LIGPE1:" ) );
		Serial.print( percentValue );
		Serial.println( ';' );
	}
}

#endif
