#include "SysConfig.h"
#if(HAS_EXAMPLE_PLUGIN)

// Includes
#include <Arduino.h>
#include "CExample.h"

void CExample::Initialize()
{
}

void CExample::Update( CCommand& commandIn )
{
    if( commandIn.Equals( "ligt" ) )
    {
        int value = commandIn.m_arguments[1]; //0 - 255
    
        Serial.print( F( "ExamplePlugin:" ) );
        
        if( value == 0 )
        { 
            Serial.print( "Example" );
        }
        else 
        { 
            Serial.print( "EXAMPLE" ); 
        }
        
        Serial.print( ';' );
    }  
}

#endif
