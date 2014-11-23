/**
 * Created on 8/24/14.
 *
 * Xi Server
 *
 * * Version: v.004
 *
 * * Updated 22 Nov 2014
 *
 * This file is common to all Xi Server types and is used to instantiate XiDuino, XiPi and XiBone servers
 *
 * Selecting the appropriate board type is done through a command line option
 *
 * Usage:
 * node xiserver.js [BOARD_ID] [URL] [DEBUG_LEVEL] [COM_PORT] [IP_PORT]
 *
 * BOARD_ID Options:
 * ard = arduino default
 * bbb = beaglebone black
 * rpi = raspberry pi
 *
 * URL:
 * Browser is launched to this URL when server is started
 * Default = "scratch.mit.edu"
 * To suppress launching, set this parameter to null
 *
 * DEBUG_LEVEL = 0 (no debug)
 *               3 (maximum debug)
 *
 *COM_PORT = force a  specific com port to be used for arduino
 * eg: "/dev/ttyACM0" or "COM3"
 *
 * IP_PORT
 * IP port number
 * Default = 1234
 *
 *
 *
 * @author: Alan Yorinks
 Copyright (c) 2014 Alan Yorinks All right reserved.

 This program is free software; you can redistribute it and/or
 modify it under the terms of the GNU General Public
 License as published by the Free Software Foundation; either
 version 3.0 of the License, or (at your option) any later version.

 This library is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 Lesser General Public License for more details.

 You should have received a copy of the GNU General Public
 License along with this library; if not, write to the Free Software
 Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
 *
 */



// when running on linux, the command needs to be prefaced by sudo

// pull in the required node packages and assign variables for the entities
var WebSocketServer = require('websocket').server;
var http = require('http');
var five = require('johnny-five');


var board; // a johnny-five 'board'

var xiServerVersion = "XiServer version .004 22 Nov 2014";

var serverType = 'ard'; // set by user in command line invocation
var urlAddr = 'http://scratch.mit.edu';
var debugLevel = 0; // set by user in command line invocation
var comPort; // communications port for Arduino - allows user to select the com port
var ipPort = 1234; // ip port number

var servoArray = [];    // array of servo devices added to the board
var piezoArray = [];    // array of piezo devices added to the board
var stepperArray = [];  // array of steppers, both 4 wire and driver


// retrieve any command line parameters
// Server Type - Arduino, BeagleBone Black, Raspberry Pi
// URL Address - to open either Scratch or Snap!
// Debug Level - send info to the console
// Com Port -   allows user to manually select the Serial Com port instead of using autodetect
// IP Port -    allows user to set IP Port. Used when multiple arduinos are connected to a single PC.

switch (process.argv.length) {
    case 3:
        serverType = process.argv[2];
        break;
    case 4:
        serverType = process.argv[2];
        urlAddr = process.argv[3];
        break;
    // all options provided
    case 5:
        serverType = process.argv[2];
        urlAddr = process.argv[3];
        debugLevel = process.argv[4];
        break;
    case 6:
        serverType = process.argv[2];
        urlAddr = process.argv[3];
        debugLevel = process.argv[4];
        comPort = process.argv[5];
        break;
    case 7:
        serverType = process.argv[2];
        urlAddr = process.argv[3];
        debugLevel = process.argv[4];
        comPort = process.argv[5];
        ipPort = process.argv[6];
        break;
    // no options provided
    case 2:
    default:
    //serverType = 'ard';
    //debugLevel = 0;
}

console.log(xiServerVersion);
// create the correct johnny-five board type
switch (serverType) {
    case 'rpi':
        console.log('XiPi Server ...');
        var raspi = require('raspi-io');

        //noinspection JSCheckFunctionSignatures
        board = new five.Board({
            io: new raspi()
        });
        break;
    case 'bbb':
        console.log('XiBone Server ...');
        var BeagleBone = require('beaglebone-io');
        //noinspection JSCheckFunctionSignatures
        board = new five.Board({
            io: new BeagleBone()
        });
        break;
    case 'ard':
    default:
        serverType = 'ard';
        console.log('XiDuino Server ...');

        // for arduino servers the default web browser is automatically opened to the scratch web page
        if (urlAddr !== "null") {
            var open = require('open'); // this is the package that opens the browser
            open(urlAddr);
        }
        // user wants to select the com port manually
        if (comPort !== undefined) {
            //noinspection JSCheckFunctionSignatures
            board = new five.Board({port: comPort});
        }
        // allow board to automatically find the com port
        else {
            //noinspection JSCheckFunctionSignatures
            board = new five.Board();
        }
}

// when the board construction completes a 'ready' message is emitted - this is the "kickoff" point
board.on('ready', function () {
    var connection; // WebSocket connection to client

    // create an http server that will be used to contain a WebSocket server
    var server = http.createServer(function (request, response) {
        // We are not processing any HTTP, so this is an empty function. 'server' is a wrapper for the
        // WebSocketServer we are going to create below.
    });

    // Create an IP listener using the http server
    server.listen(ipPort, function () {
        if (debugLevel >= 1) {
            console.log('Webserver created and listening on port ' + ipPort);
        }
    });

    // create the WebSocket Server and associate it with the httpServer
    var wsServer = new WebSocketServer({
        httpServer: server
    });

    // each time we create a new input device upon request from the client, it is added to the devices array
    var devices = [];

    // WebSocket server has been activated and a 'request' message has been received from client websocket
    wsServer.on('request', function (request) {
        // accept a connection request from Xi4S
        connection = request.accept(null, request.origin); // The server is now 'online'


        // Process Xi4S messages
        connection.on('message', function (message) {
            var pin; // the pin number contained within a message
            var index; // an index for the devices array
            var deviceID; // the device identifier contained within a message

            if (debugLevel >= 1) {
                console.log('message received: ' + message.utf8Data);
            }

            // Messages components are delimited by '/'.
            // A message is split into its components and placed in msg array.
            // The message ID is always the first element
            // TODO: explore using JSON instead of current delimitation scheme
            var msg = message.utf8Data.split('/');

            // Process each message type received
            switch (msg[0]) {
                // handshake with client at start up of socket
                case 'Xi4sOnline':
                    if (debugLevel >= 1) {
                        console.log('Xi Server has a websocket to Xi4S');
                    }
                    break;

            /**********************************************************************************************
             *********************   PIN MODE COMMAND HANDLERS    *****************************************
             **********************************************************************************************/

                // set pin mode to analog in
                // create an an instance of an analog sensor and add it to the array
                case 'setAnalogIN':
                    // get the pin number and add the 'analog' designator
                    pin = msg[3];
                    if (debugLevel >= 1) {
                        console.log("setAnalogIn", msg);
                    }
                    if (validateAnalogSetMode(msg[1], pin) === false) {
                        break;
                    }
                    // specific to XiDuino - needs to see the 'A' designator
                    if (serverType === 'ard') {
                        pin = 'A' + pin;
                    }
                    index = devices.length;
                    deviceID = msg[1];

                    addSensor(index, pin, deviceID);
                    break;
                // set pin mode to digital in
                // create a switch object to handle a digital input pin and add it to the array
                case 'setDigitalIN':
                    pin = msg[2];
                    if (validateDigitalSetMode(msg[1], pin, five.Pin.INPUT) === false) {
                        break;
                    }
                    index = devices.length;
                    deviceID = msg[3];
                    if (debugLevel >= 2) {
                        console.log("adding switch", pin, deviceID);
                    }
                    addSwitch(index, pin, deviceID);
                    break;
                // set up pin as PWM - we do not create device objects for output pins, but access them directly
                case 'setAnalogOUT':
                    pin = msg[2];
                    // PWM is considered here to be a digital mode
                    if (validateDigitalSetMode(msg[1], pin, five.Pin.PWM) !== false) {
                        board.pinMode(pin, five.Pin.PWM);
                    }
                    break;
                // set up pin as digital output
                // we do not create device objects for output pins, but access them directly
                case 'setDigitalOUT':
                    pin = msg[2];
                    // just set the pin (msg[2], to the output mode.
                    if (validateDigitalSetMode(msg[1], pin, five.Pin.OUTPUT) !== false) {
                        board.pinMode(pin, five.Pin.OUTPUT);
                    }
                    break;
                // This will set a pin to servo mode and add a standard servo device
                case 'setStandardServoMode':
                    pin = msg[2];
                    if (debugLevel >= 3) {
                        console.log('setServoMode current mode === ' + board.io.pins[pin].mode);
                        console.log('pin = ' + pin);
                        console.log(msg);
                    }
                    if (validateDigitalSetMode(msg[1], pin, five.Pin.SERVO) !== false) {
                        board.pinMode(pin, five.Pin.SERVO);
                        if (debugLevel >= 2) {
                            console.log("adding servo", pin);
                        }
                        addServo(pin, 'standard', false);
                    }
                    break;
                // This will set a pin to Servo and add a continuous servo device
                case 'setContinuousServoMode':
                    inverted = false;
                    pin = msg[2];
                    if (debugLevel >= 3) {
                        console.log('setServoMode current mode === ' + board.io.pins[pin].mode);
                        console.log('pin = ' + pin);
                        console.log(msg);
                    }

                    if (validateDigitalSetMode(msg[1], pin, five.Pin.SERVO) !== false) {
                        board.pinMode(pin, five.Pin.SERVO);
                        if (debugLevel >= 2) {
                            console.log("adding servo", pin);
                        }
                        addServo(pin, 'continuous');
                    }
                    break;
                // Set a pin for HC-SR04 type support and a ping device
                // Requires a replacement sketch for StandardFirmata
                // https://github.com/rwaldron/johnny-five/wiki/Ping#setup
                case 'setSonarMode':
                    deviceID = msg[3];
                    pin = msg[2];
                    if (debugLevel >= 1) {
                        console.log("setSonarMode", msg);
                    }
                    if (validateDigitalSetMode(msg[1], pin, five.Pin.INPUT) === false) {
                        break;
                    }
                    index = devices.length;
                    addPing(index, pin, deviceID);
                    break;
                // set a pin for infrared distance sensing and add the device
                case 'setInfraRedDistanceMode':
                    deviceID = msg[3];
                    pin = msg[2];
                    if (debugLevel >= 1) {
                        console.log("setInfraRedDistanceMode", msg);
                    }
                    if (validateAnalogSetMode(msg[1], pin, five.Pin.ANALOG) === false) {
                        break;
                    }
                    index = devices.length;
                    addInfraRed(index, pin, deviceID);
                    break;
                // set a pin to piezo tone mode and add the device
                case 'setToneMode':
                    pin = msg[2];
                    if (validateDigitalSetMode(msg[1], pin, five.Pin.OUTPUT) !== false) {
                        addPiezo(pin);
                    }
                    break;
                // The stepper motor support requires a replacement sketch for StandardFirmata
                //  https://github.com/soundanalogous/AdvancedFirmata
                // set the pins for a 4 wire stepper and a 4 wire stepper device
                case 'fourWireStepperPins':
                    var pinA = parseInt(msg[2]);
                    var pinB = parseInt(msg[3]);
                    var pinC = parseInt(msg[4]);
                    var pinD = parseInt(msg[5]);
                    var revSteps = parseInt(msg[6]);
                    if (debugLevel >= 1) {
                        console.log("fourWireStepperPin", msg);
                    }
                    if (validateDigitalSetMode(msg[1], pinA, five.Pin.OUTPUT) === false) {
                        break;
                    }
                    if (validateDigitalSetMode(msg[1], pinB, five.Pin.OUTPUT) === false) {
                        break;
                    }
                    if (validateDigitalSetMode(msg[1], pinC, five.Pin.OUTPUT) === false) {
                        break;
                    }
                    if (validateDigitalSetMode(msg[1], pinD, five.Pin.OUTPUT) === false) {
                        break;
                    }
                    addFourWireStepper(pinA, pinB, pinC, pinD, revSteps);
                    break;
                // The stepper motor support requires a replacement sketch for StandardFirmata
                //  https://github.com/soundanalogous/AdvancedFirmata
                // set the pins for a stepper driver board and a driver stepper device
                case 'stepperDriverPins':
                    if (debugLevel >= 1) {
                        console.log("stepperDriverPins", msg);
                    }
                    pinA = parseInt(msg[2]);
                    pinB = parseInt(msg[3]);
                    revSteps = parseInt(msg[4]);
                    if (validateDigitalSetMode(msg[1], pinA, five.Pin.OUTPUT) === false) {
                        break;
                    }
                    if (validateDigitalSetMode(msg[1], pinB, five.Pin.OUTPUT) === false) {
                        break;
                    }
                    addDriverStepper(pinA, pinB, revSteps);
                    break;

            /**********************************************************************************************
             *********************   COMMAND BLOCK HANDLERS             **********************************
             **********************************************************************************************/

                // write out the digital value to the pin
                case 'digitalWrite':
                    if (debugLevel >= 3) {
                        console.log('digitalWrite: board ' + msg[1] + 'pin' + msg[2] + ' value ' + msg[3]);
                    }
                    // validate that this pin was initially set to correct mode
                    if (board.io.pins[msg[2]].mode !== five.Pin.OUTPUT) {
                        connection.send('invalidPinCommand/' + 2 + '/' + msg[1] + '/' + msg[2]);
                    }
                    else {
                        if (msg[3] === 'Off') {
                            if (debugLevel >= 3) {
                                console.log(' pin off');
                            }
                            board.digitalWrite(msg[2], 0);
                        }
                        else {
                            if (debugLevel >= 3) {
                                console.log(' pin on');
                            }
                            board.digitalWrite(msg[2], 1);
                        }
                    }
                    break;
                // write out the analog value to the PWM pin
                case 'analogWrite':
                    pin = msg[2];
                    if (debugLevel >= 3) {
                        console.log('analogWrite current mode === ' + board.io.pins[msg[2]].mode);
                        console.log('pin = ' + pin);
                        console.log(msg);
                    }
                    if (board.io.pins[msg[2]].mode !== five.Pin.PWM) {
                        // send alert string
                        connection.send('invalidPinCommand/' + 3 + '/' + msg[1] + '/' + pin);
                    }
                    else {
                        board.analogWrite(msg[2], msg[3]);
                    }
                    break;
                // play a tone
                case 'playTone':
                    pin = msg[2];
                    var frequency = msg[3];
                    var duration = msg[4];

                    if (debugLevel >= 3) {
                        console.log('tone pin current mode === ' + board.io.pins[pin].mode);
                        console.log('pin = ' + pin);
                        console.log(msg);
                    }
                    if (board.io.pins[pin].mode !== five.Pin.OUTPUT) {
                        // send alert string
                        connection.send('invalidPinCommand/' + 4 + '/' + msg[1] + '/' + pin);
                        break;
                    }
                    else {
                        // retrieve piezo from array
                        for (i = 0; i < piezoArray.length; i++) {
                            if (piezoArray[i].pin === pin) {
                                piezoArray[i].frequency(frequency, duration);
                                return;
                            }
                        }
                        if (debugLevel >= 3) {
                            console.log('playTone - piezo not found for pin ' + pin);
                        }
                    }
                    break;
                case 'noTone':
                    pin = msg[2];
                    if (debugLevel >= 3) {
                        console.log('notone for pin' + pin);
                    }
                    for (i = 0; i < piezoArray.length; i++) {
                        if (piezoArray[i].pin === pin) {
                            piezoArray[i].noTone();
                            return;
                        }
                    }
                    if (debugLevel >= 3) {
                        console.log('noTone - piezo not found for pin ' + pin);
                    }
                    break;
                // move the servo to position in degrees
                // message indices: 1= board, 2 = pin, 3 = degrees
                case 'moveStandardServo':
                    pin = parseInt(msg[2]);
                    var degrees = parseInt(msg[3]);
                    var inverted = msg[4];
                    if (debugLevel >= 3) {
                        console.log('servo current mode === ' + board.io.pins[pin].mode);
                        console.log('pin = ' + pin);
                        console.log(msg);
                    }
                    if (board.io.pins[pin].mode !== five.Pin.SERVO) {
                        // send alert string
                        connection.send('invalidPinCommand/' + 5 + '/' + msg[1] + '/' + pin);
                        break;
                    }
                    else {
                        // retrieve servo from array
                        for (var i = 0; i < servoArray.length; i++) {
                            if (servoArray[i].pin === pin) {
                                if (servoArray[i].type !== "standard") {
                                    connection.send('invalidPinCommand/' + 6 + '/' + msg[1] + '/' + pin);
                                    return;
                                }
                                servoArray[i].isInverted = inverted !== 'False';
                                servoArray[i].to(degrees);
                                return;
                            }
                        }
                        if (debugLevel >= 3) {
                            console.log('moveStandardServo - servo not found for pin ' + pin);
                        }
                    }
                    break;
                // move a continuous servo in the given direction and speed
                case 'moveContinuousServo':

                    pin = parseInt(msg[2]);
                    var direction = msg[3];
                    inverted = msg[4];
                    var speed = parseFloat(msg[5]);
                    speed = parseFloat(speed.toFixed(2));
                    if (debugLevel >= 3) {
                        console.log('servo current mode === ' + board.io.pins[pin].mode);
                        console.log('pin = ' + pin);
                        console.log(msg);
                    }
                    if (board.io.pins[pin].mode !== five.Pin.SERVO) {
                        // send alert string
                        connection.send('invalidPinCommand/' + 5 + '/' + msg[1] + '/' + pin);
                        break;
                    }
                    else {

                        // retrieve servo from array
                        for (i = 0; i < servoArray.length; i++) {
                            if (servoArray[i].pin === pin) {
                                if (servoArray[i].type !== "continuous") {
                                    connection.send('invalidPinCommand/' + 7 + '/' + msg[1] + '/' + pin);
                                    return;
                                }

                                if (speed >= 0.0 && speed <= 1.0) {
                                    servoArray[i].isInverted = inverted !== 'False';
                                    if (direction === 'CW') {
                                        servoArray[i].cw(speed);
                                    }
                                    else {
                                        servoArray[i].ccw(speed);
                                    }
                                    return;
                                }
                                else {
                                    connection.send('invalidSetMode/Board ' + msg[1] + ' Pin ' + pin +
                                    ' Speed must be in the range of 0.0 to 1.0');
                                }
                                return;
                            }
                        }
                        if (debugLevel >= 3) {
                            console.log('moveContinuousServo - servo not found for pin ' + pin);
                        }
                    }
                    break;
                // stop servo motion - used for both standard and continuous
                case 'stopServo':
                    pin = parseInt(msg[2]);
                    if (debugLevel >= 3) {
                        console.log('stopServo servo current mode === ' + board.io.pins[pin].mode);
                        console.log('pin = ' + pin);
                        console.log(msg);
                    }
                    if (board.io.pins[pin].mode !== five.Pin.SERVO) {
                        // send alert string
                        connection.send('invalidPinCommand/' + 5 + '/' + msg[1] + '/' + pin);
                        break;
                    }
                    else {

                        // retrieve servo from array
                        for (i = 0; i < servoArray.length; i++) {
                            if (servoArray[i].pin === pin) {
                                servoArray[i].stop();
                                return;
                            }
                        }
                        if (debugLevel >= 3) {
                            console.log('stopServo - servo not found for pin ' + pin);
                        }
                    }
                    break;
                // move a stepper motor - this works for both 4 wire and driver.
                case 'moveStepper':
                    pin = parseInt(msg[2]);
                    var rpms = parseInt(msg[3]);
                    var dir = msg[4];
                    var acc = parseInt(msg[5]);
                    var dec = parseInt(msg[6]);
                    var stp = parseInt(msg[7]);


                    if (debugLevel >= 3) {
                        console.log('moveStepper mode ');
                        console.log('pin = ' + pin);
                        console.log(msg);
                    }

                    if (dir === 'CW') {
                        dir = five.Stepper.DIRECTION.CW;
                    }
                    else {
                        dir = five.Stepper.DIRECTION.CCW;
                    }
                    if (board.io.pins[pin].mode !== board.io.MODES.STEPPER) {
                        // send alert string
                        connection.send('invalidPinCommand/' + 8 + '/' + msg[1] + '/' + pin);
                        break;
                    }
                    else {

                        // retrieve servo from array
                        for (i = 0; i < stepperArray.length; i++) {
                            if (stepperArray[i].pins.step === pin) {
                                stepperArray[i].step({
                                    steps: stp,
                                    rpm: rpms,
                                    direction: dir,
                                    accel: acc,
                                    decel: dec
                                }, function () {
                                    console.log("Done stepping!");
                                });
                                return;
                            }

                        }

                        if (debugLevel >= 3) {
                            console.log('moveStepper - stepper not found for pin ' + pin);
                        }
                    }
                    break;

                // sets number of steps to 0 to stop stepper movement
                case 'stopStepper':
                    pin = parseInt(msg[2]);

                    if (debugLevel >= 3) {
                        console.log('stopSStepper servo current mode === ' + board.io.pins[pin].mode);
                        console.log('pin = ' + pin);
                        console.log(msg);
                    }
                    if (board.io.pins[pin].mode !== board.io.MODES.STEPPER) {
                        // send alert string
                        connection.send('invalidPinCommand/' + 8 + '/' + msg[1] + '/' + pin);
                        break;
                    }
                    else {

                        // retrieve servo from array
                        for (i = 0; i < stepperArray.length; i++) {
                            if (stepperArray[i].pins.step === pin) {
                                stepperArray[i].step({
                                    steps: 0,
                                    direction: five.Stepper.DIRECTION.CW
                                }, function () {
                                    console.log("stopped stepper pin " + pin);
                                });
                                return;
                            }
                        }
                        if (debugLevel >= 3) {
                            console.log('stopStepper - stepper not found for pin ' + pin);
                        }
                    }

                    break;


                case 'resetBoard':
                    // reset the board
                    if (debugLevel >= 2) {
                        console.log('Client is shutting down');
                    }
                    boardReset();
                    break;
                default:
                    console.log('Xi Server unknown message received: ' + msg[0]);
            }
        });
        connection.on('close', function (connection) {
            console.log('Client closed connection');
            boardReset();
        });
    });

    /****************************************************************************************************************
     ********************************* Device Creation Functions ****************************************************
     ****************************************************************************************************************/

    /***************************************************************************
     ****************** INPUT Devices - Reporters ******************************
     ***************************************************************************/

    // dynamically add a sensor and sensor change listeners and their callback functions

    // This function dynamically adds an analog sensor to the devices array.
    // It adds a listener for the 'change' event.

    function addSensor(index, myPin, myId) {

        // create the device and add it to the array
        // index already calculated to current length of array, so entry will be added to end of array
        devices[index] = new five.Sensor({
            pin: myPin,
            freq: 1,
            id: myId
        });

        // event listener call back function for the sensor
        var sensorCallbackChange = function () {
            if (debugLevel >= 1) {
                console.log(' sensor callback ' + devices[index].id + ' value = ' + devices[index].value);
            }

            connection.send('dataUpdate/' + devices[index].id + '/' + Math.ceil(devices[index].value));
        };

        // add the 'change' listener to the device array
        devices[index].addListener('change', sensorCallbackChange);
        if (debugLevel >= 2) {
            console.log('addSensor: added change listener');
            console.log('devices length = ' + devices.length + ' index = ' + index);
        }
    }

    // add an HC-SR04 type device
    function addPing(index, myPin, myId) {

        // create the device and add it to the array
        // index already calculated to current length of array, so entry will be added to end of array
        devices[index] = new five.Ping({
            pin: myPin,
            id: myId
        });
        // event listener call back function for the sensor
        var pingCallbackChange = function () {

            if (debugLevel >= 1) {
                console.log(' sensor callback inches ' + devices[index].id + ' value = ' + devices[index].inches);
            }
            connection.send('dataUpdate/' + devices[index].id + '/' + devices[index].inches.toFixed(2));
        };

        // add the 'change' listener to the device array
        devices[index].addListener('change', pingCallbackChange);
        if (debugLevel >= 2) {
            console.log('addPing: added change listener');
            console.log('devices length = ' + devices.length + ' index = ' + index);
        }
    }

    // add an infrared distance sensor
    function addInfraRed(index, pin, myId) {

        // create the device and add it to the array
        // index already calculated to current length of array, so entry will be added to end of array
        if (serverType === 'ard') {
            pin = 'A' + pin;
        }
        devices[index] = new five.Distance({
            pin: pin,
            device: 'GP2Y0A21YK',
            id: myId,
            freq: 75
        });

        var infraredCallbackChange = function () {

            if (debugLevel >= 1) {
                console.log(' infrared callback inches ' + devices[index].id + ' value = ' + devices[index].inches);
            }
            connection.send('dataUpdate/' + devices[index].id + '/' + devices[index].inches.toFixed(2));
        };

        // add the 'change' listener to the device array
        devices[index].addListener('change', infraredCallbackChange);
        if (debugLevel >= 2) {
            console.log('addInfraRed: added change listener');
            console.log('devices length = ' + devices.length + ' index = ' + index);
        }
    }

    // dynamically add a switch (digital input to the devices array)
    function addSwitch(index, myPin, myId) {
        devices[index] = new five.Switch({
            pin: myPin,
            id: myId
        });

        // event listener call back function for switch going to 'off'
        var switchOffCallbackChange = function () {
            if (debugLevel >= 1) {
                console.log(' switch callback ' + index, devices[index].id + ' off');
            }
            connection.send('dataUpdate/' + devices[index].id + '/' + 0)
        };

        // event listener call back function for switch going to 'on'
        var switchOnCallbackChange = function () {
            if (debugLevel >= 1) {
                console.log(' switch callback ' + index, devices[index].id + ' on');
            }
            connection.send('dataUpdate/' + devices[index].id + '/' + 1)
        };

        // add the open and closed listeners to devices in the array
        devices[index].addListener('open', switchOffCallbackChange);
        devices[index].addListener('close', switchOnCallbackChange);
    }

    // dynamically add a servo to the devices array
    function addServo(myPin, servoType) {
        var servo = new five.Servo({
            pin: myPin,
            type: servoType
        });

        servoArray.push(servo);
    }

    /***************************************************************************
     ******************      OUTPUT Devices       ******************************
     ***************************************************************************/

    // dynamically add a piezo device to the piezo array
    function addPiezo(pin) {
        var piezo = new five.Piezo({
            pin: pin
        });
        piezoArray.push(piezo);
    }

    function addFourWireStepper(pinA, pinB, pinC, pinD, revSteps) {
        revSteps = parseInt(revSteps);
        var stepper = new five.Stepper({
            type: five.Stepper.TYPE.FOUR_WIRE,
            pins: [pinA, pinB, pinC, pinD],
            stepsPerRev: revSteps
        });
        stepperArray.push(stepper);

    }

    function addDriverStepper(pinA, pinB, revSteps) {
        revSteps = parseInt(revSteps);
        var stepper = new five.Stepper({
            type: five.Stepper.TYPE.DRIVER,
            pins: [pinA, pinB],
            stepsPerRev: revSteps
        });
        stepperArray.push(stepper);
    }

    // place holder if we ever need to do anything
    function boardReset() {
        for (var i = 0; i < servoArray.length; i++) {
            servoArray[i].stop();
        }
        for (i = 0; i < stepperArray.length; i++) {
            if (stepperArray[i].pins.motor1 === pin) {
                stepperArray[i].step({
                    steps: 0,
                    direction: five.Stepper.DIRECTION.CW
                }, function () {
                    console.log("stopped stepper pin " + pin);
                });
            }
        }
    }

    /****************************************************************************************************
     ************************  UTILITY FUNCTIONS ********************************************************
     ****************************************************************************************************/

    // Determine if a digital pin mode has already been set and if not, does this pin support the mode?
    // Returns true fs all tests pass, or false if any one fails.

    function validateDigitalSetMode(boardID, pin, mode) {

        if (debugLevel >= 1) {
            console.log('validateDigitalSetMode ' + pin + ' ' + mode);
        }

        // does board support pin number?
        if (board.io.pins.length < pin) {
            // send alert pin number exceeds number of pins on board
            connection.send('invalidSetMode/Board ' + boardID + ' Pin ' + pin +
            ' Exceeds Maximum Number of Pins on Board');
            return false;
        }

        var currentMode = board.io.pins[pin].mode; // get the current mode of the pin

        switch (currentMode) {
            // boards are not consistent on how they indicate that a pin mode was not yet assigned
            // so check for any
            case 0: // rpi
            case undefined: // ard
            case null: //bbb
                break;
            default:
                // it was set before, but if it is the same just return true and continue on
                if (currentMode === mode) {
                    return true
                }
                else {
                    connection.send('invalidSetMode/' + 9 + '/' + boardID + '/' + pin);
                    return false;
                }
        }

        if (debugLevel >= 3) {
            console.log('validateDigitalSetMode supported modes: ' + board.io.pins[pin].supportedModes);
        }


        // check to make sure that the pin actually supports the mode that the client is requesting
        for (var i = 0; i < board.io.pins[pin].supportedModes.length; i++) {
            if (debugLevel >= 3) {
                console.log('validateDigitalSetMode: mode = ' + mode);
            }

            if (board.io.pins[pin].supportedModes[i] == mode) {
                return true;
            }
        }

        // alert pin does not support mode
        connection.send('invalidSetMode/' + 1 + '/' + boardID + '/' + pin);
        return false;
    }

    // determine if a pin can be set analog mode (PWM)

    function validateAnalogSetMode(boardID, pin) {
        // check to see if the pin number is in the range of possible analog pins
        var pinMapped = false;
        var i;
        var analogPin;

        if (pin > board.io.analogPins.length) {
            connection.send('invalidSetMode/' + 0 + '/' + boardID + '/' + pin);
            return false;
        }

        // convert analog pin number to actual pin number
        for (i = 0; i < board.io.pins.length; i++) {
            if (board.io.pins[i].analogChannel == pin) {
                // we found a match
                analogPin = i;
                pinMapped = true;
                break; // get out of loop
            }
        }
        if (pinMapped === false) {
            connection.send('invalidSetMode/' + 11 + '/' + boardID + '/' + pin);
            return false;
        }

        // has pin been already been assigned?
        var currentMode = board.io.pins[analogPin].mode;
        if (currentMode != undefined || currentMode != null) {
            // send alert string
            connection.send('invalidSetMode/Board ' + boardID + ' Pin ' + analogPin +
            ' was previously assigned mode ' + currentMode);
            return false;
        }

        for (i = 0; i < board.io.pins[analogPin].supportedModes.length; i++) {
            if (board.io.pins[analogPin].supportedModes[i] === five.Pin.ANALOG) {
                return true;
            }
        }
        return false;

    }
});
