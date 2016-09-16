function ClassicControlMapping(name, deps) {
  console.log('Loaded classic control mapping plugin');
}

ClassicControlMapping.prototype.getControlMappingPreset = function getControlMappingPreset(){
    return [
        {
          "name": "OpenROV Classic RO",
          "default": true,
          "map": [
            {
              "name": "blackbox.record",
              "bindings": [
                {
                  "name": "keyboard",
                  "binding": "r"
                }
              ],
              "description": "Start recording telemetry data.",
              "defaults": {
                "keyboard": "r"
              }
            },
            {
              "name": "plugin.cameraTilt.adjust_down",
              "bindings": [
                {
                  "name": "keyboard",
                  "binding": "z"
                },
                {
                  "name": "gamepad",
                  "binding": "A"
                }
              ],
              "description": "Point the camera further down.",
              "defaults": {
                "keyboard": "z",
                "gamepad": "A"
              }
            },
            {
              "name": "plugin.cameraTilt.adjust_centre",
              "bindings": [
                {
                  "name": "keyboard",
                  "binding": "a"
                },
                {
                  "name": "gamepad",
                  "binding": "B"
                }
              ],
              "description": "Point the camera straight ahead.",
              "defaults": {
                "keyboard": "a",
                "gamepad": "B"
              }
            },
            {
              "name": "plugin.cameraTilt.adjust_up",
              "bindings": [
                {
                  "name": "keyboard",
                  "binding": "q"
                },
                {
                  "name": "gamepad",
                  "binding": "Y"
                }
              ],
              "description": "Point the camera further up.",
              "defaults": {
                "keyboard": "q",
                "gamepad": "Y"
              }
            },
            {
              "name": "rovPilot.powerOnESC",
              "bindings": [
                {
                  "name": "keyboard",
                  "binding": "["
                }
              ],
              "description": "Switches the ESCs on",
              "defaults": {
                "keyboard": "["
              }
            },
            {
              "name": "rovPilot.powerOffESC",
              "bindings": [
                {
                  "name": "keyboard",
                  "binding": "]"
                }
              ],
              "description": "Switches the ESCs off",
              "defaults": {
                "keyboard": "]"
              }
            },
            {
              "name": "example.keyBoardMapping",
              "bindings": [
                {
                  "name": "keyboard",
                  "binding": "alt+0"
                },
                {
                  "name": "gamepad",
                  "binding": "X"
                }
              ],
              "description": "Example for keymapping.",
              "defaults": {
                "keyboard": "alt+0",
                "gamepad": "X"
              }
            },
            {
              "name": "example.testMessage",
              "bindings": [
                {
                  "name": "keyboard",
                  "binding": "alt+T"
                }
              ],
              "description": "another example",
              "defaults": {
                "keyboard": "alt+T"
              }
            },
            {
              "name": "plugin.externalLights.0.adjust_increment",
              "bindings": [
                {
                  "name": "keyboard",
                  "binding": "6 ="
                }
              ],
              "description": "Makes the ROV lights brighter.",
              "defaults": {
                "keyboard": "6 ="
              }
            },
            {
              "name": "plugin.externalLights.0.adjust_decrememt",
              "bindings": [
                {
                  "name": "keyboard",
                  "binding": "6 -"
                }
              ],
              "description": "Makes the ROV lights dimmer.",
              "defaults": {
                "keyboard": "6 -"
              }
            },
            {
              "name": "plugin.externalLights.0.toggle",
              "bindings": [
                {
                  "name": "keyboard",
                  "binding": "6 0"
                }
              ],
              "description": "Toggles the ROV lights on/off.",
              "defaults": {
                "keyboard": "6 0"
              }
            },
            {
              "name": "plugin.externalLights.1.adjust_increment",
              "bindings": [
                {
                  "name": "keyboard",
                  "binding": "7 ="
                }
              ],
              "description": "Makes the ROV lights brighter.",
              "defaults": {
                "keyboard": "7 ="
              }
            },
            {
              "name": "plugin.externalLights.1.adjust_decrememt",
              "bindings": [
                {
                  "name": "keyboard",
                  "binding": "7 -"
                }
              ],
              "description": "Makes the ROV lights dimmer.",
              "defaults": {
                "keyboard": "7 -"
              }
            },
            {
              "name": "plugin.externalLights.1.toggle",
              "bindings": [
                {
                  "name": "keyboard",
                  "binding": "7 0"
                }
              ],
              "description": "Toggles the ROV lights on/off.",
              "defaults": {
                "keyboard": "7 0"
              }
            },
            {
              "name": "plugin.laser.Toggle",
              "bindings": [
                {
                  "name": "keyboard",
                  "binding": "l"
                }
              ],
              "description": "Toggles the lasers on or off.",
              "defaults": {
                "keyboard": "l"
              }
            },
            {
              "name": "plugin.lights.adjust_increment",
              "bindings": [
                {
                  "name": "keyboard",
                  "binding": "o"
                },
                {
                  "name": "gamepad",
                  "binding": "DPAD_DOWN"
                }
              ],
              "description": "Makes the ROV lights brighter.",
              "defaults": {
                "keyboard": "o",
                "gamepad": "DPAD_DOWN"
              }
            },
            {
              "name": "plugin.lights.toggle",
              "bindings": [
                {
                  "name": "keyboard",
                  "binding": "i"
                }
              ],
              "description": "Toggles the ROV lights on/off.",
              "defaults": {
                "keyboard": "i"
              }
            },
            {
              "name": "newUi.showTelemetry",
              "bindings": [
                {
                  "name": "keyboard",
                  "binding": "alt+t"
                }
              ],
              "description": "Show the telemetry window.",
              "defaults": {
                "keyboard": "alt+t"
              }
            },
            {
              "name": "newUi.showSerialMonitor",
              "bindings": [
                {
                  "name": "keyboard",
                  "binding": "alt+s"
                }
              ],
              "description": "Show the serial port window.",
              "defaults": {
                "keyboard": "alt+s"
              }
            },
            {
              "name": "rovPilot.incrementPowerLevel",
              "bindings": [],
              "description": "Increment the thruster power level",
              "defaults": {}
            },
            {
              "name": "rovPilot.moveForward",
              "bindings": [
                {
                  "name": "keyboard",
                  "binding": "up"
                }
              ],
              "description": "Set throttle forward.",
              "defaults": {
                "keyboard": "up"
              }
            },
            {
              "name": "rovPilot.moveThrottle",
              "bindings": [
                {
                  "name": "gamepad",
                  "binding": "LEFT_STICK_Y"
                }
              ],
              "description": "Set throttle via axis input.",
              "defaults": {
                "gamepad": "LEFT_STICK_Y"
              }
            },
            {
              "name": "rovPilot.moveBackwards",
              "bindings": [
                {
                  "name": "keyboard",
                  "binding": "down"
                }
              ],
              "description": "Set throttle backwards (aft).",
              "defaults": {
                "keyboard": "down"
              }
            },
            {
              "name": "rovPilot.moveYaw",
              "bindings": [
                {
                  "name": "gamepad",
                  "binding": "LEFT_STICK_X"
                }
              ],
              "description": "Turn the ROV via axis input.",
              "defaults": {
                "gamepad": "LEFT_STICK_X"
              }
            },
            {
              "name": "rovPilot.moveLeft",
              "bindings": [
                {
                  "name": "keyboard",
                  "binding": "left"
                }
              ],
              "description": "Turn the ROV to the port side (left).",
              "defaults": {
                "keyboard": "left"
              }
            },
            {
              "name": "rovPilot.moveRight",
              "bindings": [
                {
                  "name": "keyboard",
                  "binding": "right"
                }
              ],
              "description": "Turn the ROV to the starboard side (right).",
              "defaults": {
                "keyboard": "right"
              }
            },
            {
              "name": "rovPilot.moveLift",
              "bindings": [
                {
                  "name": "gamepad",
                  "binding": "RIGHT_STICK_Y"
                }
              ],
              "description": "Bring the ROV shallower or deeper via axis input.",
              "defaults": {
                "gamepad": "RIGHT_STICK_Y"
              }
            },
            {
              "name": "rovPilot.moveUp",
              "bindings": [
                {
                  "name": "keyboard",
                  "binding": "shift"
                }
              ],
              "description": "Bring the ROV shallower (up).",
              "defaults": {
                "keyboard": "shift"
              }
            },
            {
              "name": "rovPilot.moveDown",
              "bindings": [
                {
                  "name": "keyboard",
                  "binding": "ctrl"
                }
              ],
              "description": "Bring the ROV deeper (down).",
              "defaults": {
                "keyboard": "ctrl"
              }
            },
            {
              "name": "rovPilot.powerLevel1",
              "bindings": [
                {
                  "name": "keyboard",
                  "binding": "1"
                }
              ],
              "description": "Set the power level of the ROV to level 1.",
              "defaults": {
                "keyboard": "1"
              }
            },
            {
              "name": "rovPilot.powerLevel2",
              "bindings": [
                {
                  "name": "keyboard",
                  "binding": "2"
                }
              ],
              "description": "Set the power level of the ROV to level 2.",
              "defaults": {
                "keyboard": "2"
              }
            },
            {
              "name": "rovPilot.powerLevel3",
              "bindings": [
                {
                  "name": "keyboard",
                  "binding": "3"
                }
              ],
              "description": "Set the power level of the ROV to level 3.",
              "defaults": {
                "keyboard": "3"
              }
            },
            {
              "name": "rovPilot.powerLevel4",
              "bindings": [
                {
                  "name": "keyboard",
                  "binding": "4"
                }
              ],
              "description": "Set the power level of the ROV to level 4.",
              "defaults": {
                "keyboard": "4"
              }
            },
            {
              "name": "rovPilot.powerLevel5",
              "bindings": [
                {
                  "name": "keyboard",
                  "binding": "5"
                }
              ],
              "description": "Set the power level of the ROV to level 5.",
              "defaults": {
                "keyboard": "5"
              }
            },
            {
              "name": "rovPilot.toggleHeadingHold",
              "bindings": [
                {
                  "name": "keyboard",
                  "binding": "m"
                }
              ],
              "description": "Toggles the heading hold on/off",
              "defaults": {
                "keyboard": "m"
              }
            },
            {
              "name": "rovPilot.toggleDepthHold",
              "bindings": [
                {
                  "name": "keyboard",
                  "binding": "n"
                }
              ],
              "description": "Toggles the depth hold on/off",
              "defaults": {
                "keyboard": "n"
              }
            },
            {
              "name": "serialMonitor.toggleSerialMonitor",
              "bindings": [
                {
                  "name": "keyboard",
                  "binding": "u"
                }
              ],
              "description": "Shows/hides raw serial monitor.",
              "defaults": {
                "keyboard": "u"
              }
            },
            {
              "name": "tankcontrol.toggleTankControl",
              "bindings": [
                {
                  "name": "keyboard",
                  "binding": "t"
                }
              ],
              "description": "Toggles the tank control mode on/off",
              "defaults": {
                "keyboard": "t"
              }
            },
            {
              "name": "rov.controlNames.leftLift",
              "bindings": [
                {
                  "name": "gamepad",
                  "binding": "LEFT_STICK_X"
                }
              ],
              "description": "Tankcontrol: Lift control control for the left hand gamepad.",
              "defaults": {
                "gamepad": "LEFT_STICK_X"
              }
            },
            {
              "name": "rov.controlNames.portThrottle",
              "bindings": [
                {
                  "name": "gamepad",
                  "binding": "LEFT_STICK_Y"
                }
              ],
              "description": "Tankcontrol: Throttle control for the port prop.",
              "defaults": {
                "gamepad": "LEFT_STICK_Y"
              }
            },
            {
              "name": "rov.controlNames.rightLift",
              "bindings": [
                {
                  "name": "gamepad",
                  "binding": "RIGHT_STICK_X"
                }
              ],
              "description": "Tankcontrol: Lift control control for the right hand gamepad.",
              "defaults": {
                "gamepad": "RIGHT_STICK_X"
              }
            },
            {
              "name": "rov.controlNames.starboardThrottle",
              "bindings": [
                {
                  "name": "gamepad",
                  "binding": "RIGHT_STICK_Y"
                }
              ],
              "description": "Tankcontrol: Throttle control for the starboard prop.",
              "defaults": {
                "gamepad": "RIGHT_STICK_Y"
              }
            },
            {
              "name": "rov.controlNames.starboardThrottle",
              "bindings": [
                {
                  "name": "gamepad",
                  "binding": "RIGHT_STICK_Y"
                }
              ],
              "description": "Tankcontrol: Throttle control for the starboard prop.",
              "defaults": {
                "gamepad": "RIGHT_STICK_Y"
              }
            }
          ]
        }
]

}

module.exports = function (name, deps) {
  return new ClassicControlMapping(name,deps);
};
