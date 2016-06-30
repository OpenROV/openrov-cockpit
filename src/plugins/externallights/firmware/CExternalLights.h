#pragma once

// Includes
#include "../CModule.h"

class CExternalLights : public CModule
{
public:
    void Initialize();
    void Update( CCommand& commandIn );
};
