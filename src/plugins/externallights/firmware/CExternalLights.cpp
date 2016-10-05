#include "SysConfig.h"
#if(HAS_EXT_LIGHTS && CONTROLLERBOARD == CONTROLLERBOARD_CB25 )

// Includes
#include <Arduino.h>
#include "CExternalLights.h"
#include "NCommManager.h"
#include "NVehicleManager.h"

namespace
{
	// 1% per 10ms
	const float kPowerDelta = 0.01f;

	inline uint32_t PercentToAnalog( float x )
	{	
		if( x < 0.0f )
		{
			return 0;
		}
		else if( x < 0.33f )
		{
			// Linear region, 0-80
			return static_cast<uint32_t>( 242.424f * x );
		}
		else
		{
			// Parabolic region 80-255
			return static_cast<uint32_t>( ( 308.571f * x * x ) - ( 147.426f * x ) + 95.0f );
		}
	}
}

CExternalLights::CExternalLights( uint32_t pinIn )
	: m_pin( "elight", pinIn, CPin::kAnalog, CPin::kOutput )
{
}

void CExternalLights::Initialize()
{
	NVehicleManager::m_capabilityBitmask |= ( 1 << LIGHTS_CAPABLE );

	// Reset pin
	m_pin.Reset();
	m_pin.Write( 0 );

	// Reset timers
    m_controlTimer.Reset();
    m_telemetryTimer.Reset();
}

void CExternalLights::Update( CCommand& commandIn )
{
	// Check for messages
	if( !NCommManager::m_isCommandAvailable )
	{
		return;
	}

	// Handle messages
	if( commandIn.Equals( "elights_tpow" ) )
	{
		// Update the target position
		m_targetPower = util::Decode1K( commandIn.m_arguments[1] );

		// TODO: Ideally this unit would have the ability to autonomously set its own target and ack receipt with a separate mechanism
		// Acknowledge target position
		Serial.print( F( "elights_tpow:" ) );
		Serial.print( commandIn.m_arguments[1] );
		Serial.println( ';' );

		// Pass through linearization function
		m_targetPower_an = PercentToAnalog( m_targetPower );

		// Apply ceiling
		if( m_targetPower_an > 255 )
		{
			m_targetPower_an = 255;
		}

		// Directly move to target power
		m_currentPower 		= m_targetPower;
		m_currentPower_an 	= m_targetPower_an;

		// Write the power value to the pin
		m_pin.Write( m_currentPower_an );

		// Emit current power
		Serial.print( F( "elights_pow:" ) );
		Serial.print( util::Encode1K( m_currentPower ) );
		Serial.print( ';' );
	}

	// TODO: Disabled until discrepancies resolved.
	// Run servo adjustment at 100Hz
    // if( m_controlTimer.HasElapsed( 10 ) )
    // {
	// 	if( m_currentPower_an != m_targetPower_an )
	// 	{
	// 		float error = m_targetPower - m_currentPower;

	// 		// Manage transition speed (100% per second)
	// 		if( abs( error ) < kPowerDelta )
	// 		{
	// 			// Move directly to targets. No need to calculate conversions
	// 			m_currentPower 		= m_targetPower;
	// 			m_currentPower_an 	= m_targetPower_an;
	// 		}
	// 		else
	// 		{
	// 			// Move currentPower by kPowerDelta increment
	// 			m_currentPower += ( ( error < 0.0f ) ? -kPowerDelta : kPowerDelta );

	// 			// Update the analog power representation
	// 			m_currentPower_an = PercentToAnalog( m_currentPower );

	// 			// Apply ceiling
	// 			if( m_currentPower_an > 255 )
	// 			{
	// 				m_currentPower_an = 255;
	// 			}
	// 		}

	// 		// Write the power value to the pin
	// 		m_pin.Write( m_currentPower_an );

	// 		// Snap floating point power to target power to handle any potential float<->int errors
	// 		if( m_currentPower_an == m_targetPower_an )
	// 		{
	// 			m_currentPower_an = m_targetPower_an;
	// 		}
	// 	}

	// 	Serial.print( F( "lights_pow:" ) );
	// 	Serial.print( util::Encode1K( m_currentPower ) );
	// 	Serial.print( ';' );

	// 	Serial.print( F( "test_light:" ) );
	// 	Serial.print( m_currentPower_an );
	// 	Serial.print( ';' );
	// }

	// // Emit power telemetry at 10Hz, but only on changes
    // if( m_telemetryTimer.HasElapsed( 100 ) )
    // {
	// 	if( m_lastPower_an != m_currentPower_an )
	// 	{
	// 		Serial.print( F( "lights_pow:" ) );
	// 		Serial.print( util::Encode1K( m_currentPower ) );
	// 		Serial.print( ';' );

	// 		m_lastPower_an = m_currentPower_an;
	// 	}
    // }
}

#endif
