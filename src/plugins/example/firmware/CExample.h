#pragma once

// Includes
#include "CModule.h"

class CExample : public CModule
{
public:
    CExample( uint32_t defaultValueIn = 0 );    // Optional constructor
    
    void Initialize();                          // Required function
    void Update( CCommand& commandIn );         // Required function

private:
    uint32_t m_myVariable;                      // Optional private data
    void SayHello();                            // Optional private method
};

