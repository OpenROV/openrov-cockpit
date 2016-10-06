#include "SysConfig.h"

// Includes
#include "CExample.h"
#include "NCommManager.h"

// Optional: You can specify a non-default constructor for this class.
// The base CModule class will have its constructor called automatically before your constructor
CExample::CExample( uint32_t defaultValueIn )
    : m_myVariable( defaultValueIn )
{
}

void CExample::Initialize()
{
    // This gets called once at the beginning of the program. You can put initialization logic here.
}

void CExample::Update( CCommand& commandIn )
{
    // Check for messages. If no messages are available, there may not be a need to do anything else!
	if( NCommManager::m_isCommandAvailable )
	{
		// Check for specific messages by comparing the command to command types we are interested in
		if( commandIn.Equals( "ex_hello" ) )
		{
            // Argument[ 0 ] is the number of arguments
            // The arguments start at index 1 and are of type uint32_t
            m_myVariable = commandIn.m_arguments[1];
        
            SayHello();
        } 
    }
}

void CExample::SayHello()
{
    // The UART wire format is "<fieldName>:<message>;"
    // The ':' separates the field name from the message. The ';' ends the message.

    // In this example, we will print out either:
    //      "example:Hello!;"
    //      or
    //      "example:Goodbye!;"

    // Print the field name
    Serial.print( F( "example:" ) );
    
    // Depending on the command we received, print the appropriate response
    if( m_myVariable == 1 )
    { 
        Serial.print( F( "Hello!" ) );
    }
    else 
    { 
        Serial.print( F( "Goodbye!" ) ); 
    }
    
    // Terminate the message
    Serial.print( ';' );
}
