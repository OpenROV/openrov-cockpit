#pragma once

#include "SysConfig.h"
#if(HAS_EXT_LIGHTS && CONTROLLERBOARD == CONTROLLERBOARD_CB25 )

	#include "CExternalLights.h"
	CExternalLights elights( PIN_PWM_3 );

#endif