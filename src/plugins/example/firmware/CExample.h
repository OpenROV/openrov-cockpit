#pragma once

// Includes
#include "../CModule.h"

class CExample : public CModule
{
public:
    void Initialize();
    void Update( CCommand& commandIn );
};

