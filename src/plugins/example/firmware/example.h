#pragma once

// This is the object instantiation file. Eventually, this will be automatically generated in cockpit.
// Until then, you need to check the SysConfig file to see if the module has been enabled.
// If it has been enabled, you can create an instance of the module!
// You can also just skip the SysConfig check, but no guarantees you won't break anything!

#include "SysConfig.h"
#if(HAS_EXAMPLE_PLUGIN)

	#include "CExample.h"
	CExample example;
	
#endif