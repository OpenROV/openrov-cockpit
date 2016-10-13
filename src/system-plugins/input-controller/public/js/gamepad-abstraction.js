//http://www.html5rocks.com/en/tutorials/doodles/gamepad/gamepad-tester/tester.html
//useful for testing the buttons and finding the numbers
//
//Requires the https://github.com/kallaspriit/HTML5-JavaScript-Gamepad-Controller-Library
//library.
var inputController = namespace('systemPlugin.inputController');
inputController.GamepadAbstraction = function (cockpit) {
  var gamepad = new HTML5Gamepad();
  var gp = {
      cockpit: cockpit,
      currentButton: undefined,
      assignment: {}
    };
  var isSupported = function () {
  };
  var ignoreInputUntil = 0;
  gp.getPositions = function () {
    window.requestAnimationFrame(updateStatus);
    return padStatus.position;
  };
  gamepad.bind(HTML5Gamepad.Event.BUTTON_DOWN, function (e) {
    var control = e.control;
    console.log(control);
    if (gp.currentButton === undefined) {
      gp.currentButton = e.control;
    } else {
      control = gp.currentButton + '+' + e.control;
    }
    if (gp.assignment[control] !== undefined) {
      gp.assignment[control].BUTTON_DOWN();
    }
    cockpit.emit('systemPlugin.inputController.gamepad.buttonDown', control);    
  });
  gamepad.bind(HTML5Gamepad.Event.BUTTON_UP, function (e) {
    if (gp.currentButton === e.control) {
      gp.currentButton = undefined;
    }
    if (gp.assignment[e.control] !== undefined) {
      if (gp.assignment[e.control].BUTTON_UP !== undefined) {
        gp.assignment[e.control].BUTTON_UP();
      }
    }
    cockpit.emit('systemPlugin.inputController.gamepad.buttonUp', e.control);
  });
  gamepad.bind(HTML5Gamepad.Event.AXIS_CHANGED, function (e) {
    if (new Date().getTime() < ignoreInputUntil)
      return;
    //avoids inacurrate readings when the gamepad has just been connected from affecting the ROV
    if (gp.assignment[e.axis] !== undefined) {
      gp.assignment[e.axis].AXIS_CHANGED(e.value);
    }
    cockpit.emit('systemPlugin.inputController.gamepad.axisChanged', e.axis);
  });
  var updateStatus = function () {
    window.requestAnimationFrame(updateStatus);
  };
  gamepad.bind(HTML5Gamepad.Event.CONNECTED, function (device) {
    ignoreInputUntil = new Date().getTime() + 1000;
    console.log('Controller connected', device);
    gp.cockpit.emit('plugin.input.gamepad.state', { connected: true });
  });
  gamepad.bind(HTML5Gamepad.Event.DISCONNECTED, function (device) {
    console.log('Controller disconnected', device);
    gp.cockpit.emit('plugin.input.gamepad.state', { connected: false });
  });
  gamepad.bind(HTML5Gamepad.Event.UNSUPPORTED, function (device) {
    console.log('Unsupported controller connected', device);
  });
  gp.isAvailable = function () {
    if (gamepad.count() === 0)
      return false;
    return true;
  };
  if (!gamepad.init()) {
    console.log('Your browser does not support gamepads, get the latest Google Chrome or Firefox.');
  }
  if (gp.isAvailable()) {
    //send an initial is connected if already plugged in.
    setTimeout(function () {
      gp.cockpit.emit('gamepad.connected');
    }, 1000);
  }
  return gp;
};