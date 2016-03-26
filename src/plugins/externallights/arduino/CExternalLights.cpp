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
    
    #ifndef ELIGHTS_PIN
        #define ELIGHTS_PIN 46 //to override, add a define to the AConfig.h file.
    #endif
#endif

namespace
{
    Pin elight("elight", ELIGHTS_PIN, elight.analog, elight.out);
}

void CExternalLights::Initialize()
{
    NConfigManager::m_capabilityBitmask |= ( 1 << LIGHTS_CAPABLE );
    
    elight.Reset();
    elight.Write(0);
}

void CExternalLights::Update( CCommand& commandIn )
{
    if( commandIn.Equals( "eligt" ) )
	{
		float percentValue = ( float )commandIn.m_arguments[1] / 100.0f;
		int value = (int)( 255.0f * percentValue );
		
		elight.Write( value );
		
		Serial.print( F( "LIGTE:" ) );
		Serial.print( value );
		Serial.print( ';' );
		
		Serial.print( F( "LIGPE:" ) );
		Serial.print( percentValue );
		Serial.println( ';' );
	}
}

#endif
