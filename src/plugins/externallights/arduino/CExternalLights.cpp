#include "../AConfig.h"
#if(HAS_EXT_LIGHTS)

// Includes
#include <Arduino.h>
#include "CExternalLights.h"
#include "../CPin.h"
#include "../NConfigManager.h"

// One of these will have the correct pin defined for the lights
#if(HAS_STD_CAPE)
    #include "CCape.h"
#endif

#if(HAS_OROV_CONTROLLERBOARD_25)
    #include "../CControllerBoard.h"
    
    #ifndef ELIGHTS0_PIN
        #define ELIGHTS0_PIN 46
    #endif
    #ifndef ELIGHTS1_PIN
        #define ELIGHTS1_PIN 12
    #endif
#endif

namespace
{
    CPin elight0("elight0", ELIGHTS0_PIN, CPin::kAnalog, CPin::kOutput);
    CPin elight1("elight1", ELIGHTS1_PIN, CPin::kAnalog, CPin::kOutput);
}

void CExternalLights::Initialize()
{
    NConfigManager::m_capabilityBitmask |= ( 1 << LIGHTS_CAPABLE );
    
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
