The ROV Pilot plugin controls a majority of the movement of the ROV.

This plugin is designed to handle movement in 6 axis with rotations.  Those movements are:

Along the axis:
thrust
lift
strafe

Rotation around the axis:
roll
pitch
yaw

Note that this plugin exposes an API for requesting ROV movemenent operations but it does not include any logic for input devices.  Those are seperate plugins that call the ROV UI APIs.
