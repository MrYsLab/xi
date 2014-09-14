/**
 * Created on 8/24/14.
 *
 * Xi Server
 *
 * * Version: v.001
 *
 * This file is common to all Xi Server types and is used to instantiate XiDuino, XiPi and XiBone servers
 *
 * Selecting the appropriate board type is done through a command line option
 *
 * BOARD_ID Options:
 * ard = arduino
 * bbb = beaglebone black
 * rpi = raspberry pi
 *
 * command line invocation:
 *
 * node xiserver.js BOARD_ID_OPTION
 *
 * i.e. beaglebone black:
 *
 * node xiserver.js bbb
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

// command line entry to start a server
//
// node xiserver.js [serverType] [debugLevel]
//
// where serverType and debugLevel are optional
// valid option values:
// serverType: 'ard' 'bbb' 'rpi'
// debugLevel: 0-3

// when running on linux, the command needs to be prefaced by sudo

// pull in the required node packages and assign variables for the entities
var WebSocketServer = require('websocket').server;
var http = require('http');
var five = require('johnny-five');

var board; // a johnny-five 'board'
var debugLevel; // set by user in command line invocation
var serverType; // set by user in command line invocation

// save the server type from the command line

switch (process.argv.length) {
    // serverType provided but not debugLevel
    case 3:
        serverType = process.argv[2];
        debugLevel = 0;
        break;
    // all options provided
    case 4:
        serverType = process.argv[2];
        debugLevel = process.argv[3];
        break;
    // no options provided
    case 2:
    default:
        serverType = 'ard';
        debugLevel = 0;
}

// create the correct johnny-five board type
switch (serverType) {
    case 'rpi':
        console.log('XiPi Server ...');
        var raspi = require('raspi-io');

        board = new five.Board({
            io: new raspi()
        });
        break;
    case 'bbb':
        console.log('XiBone Server ...');
        var BeagleBone = require('beaglebone-io');
        board = new five.Board({
            io: new BeagleBone()
        });
        break;
    case 'ard':
    default:
        serverType = 'ard';
        console.log('XiDuino Server ...');

        // for arduino servers the default web browser is automatically opened to the scratch web page
        // TODO: provide an option to suppress opening the web browser
        // TODO: provide an option to specify the url
        var open = require('open'); // this is the package that opens the browser
        open('http://scratch.mit.edu/');
        board = new five.Board();
}

// when the board construction completes a 'ready' message is emitted
board.on('ready', function () {
    var connection; // WebSocket connection to client

    // create an http server that will be used to contain a WebSocket server
    var server = http.createServer(function (request, response) {
        // We are not processing any HTTP, so this is an empty function. 'server' is a wrapper for the
        // WebSocketServer we are going to create below.
    });

    // Create an IP listener using the http server
    server.listen(1234, function () {
        if (debugLevel >= 1) {
            console.log('Webserver created and listening on port 1234');
        }
    });

    // create the WebSocket Server and associate it with the httpServer
    var wsServer = new WebSocketServer({
        httpServer: server
    });

    // each time we create a new device upon request from the client, it is added to the devices array
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
                // set up pin as PWM - we do not create device objects for pins, but access them directly
                case 'setAnalogOUT':
                    pin = msg[2];
                    // PWM is considered here to be a digital mode
                    if (validateDigitalSetMode(msg[1], pin, five.Pin.PWM) !== false) {
                        board.pinMode(pin, five.Pin.PWM);
                    }
                    break;
                // set up pin as digital output
                // we do not create device objects for pins, but access them directly
                case 'setDigitalOUT':
                    pin = msg[2];
                    // just set the pin (msg[2], to the output mode.
                    if (validateDigitalSetMode(msg[1], pin, five.Pin.OUTPUT) !== false) {
                        board.pinMode(pin, five.Pin.OUTPUT);
                    }
                    break;
                // write out the digital value to the pin
                case 'digitalWrite':
                    if (debugLevel >= 3) {
                        console.log('digitalWrite: board ' + msg[1] + 'pin' + msg[2] + ' value ' + msg[3]);
                    }
                    // validate that this pin was initially set to correct mode
                    if (board.io.pins[msg[2]].mode !== five.Pin.OUTPUT) {
                        connection.send('invalidPinCommand/Board ' + msg[1] + ' Pin ' + msg[2] +
                            ' This pin was not configured for digital write');
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
                    if (debugLevel >= 3) {
                        console.log('analogWrite current mode === ' + board.io.pins[msg[2]].mode);
                        console.log('pin = ' + pin);
                        console.log(msg);
                    }
                    if (board.io.pins[msg[2]].mode !== five.Pin.PWM) {
                        // send alert string
                        connection.send('invalidPinCommand/Board ' + msg[1] + ' Pin ' + pin
                            + ' This pin was not configured for analog write');
                    }
                    else {
                        board.analogWrite(msg[2], msg[3]);
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

    // dynamically add a sensor and sensor listeners
    // This function dynamically adds a sensor to the devices array.
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
            console.log('added change listener');
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

    // place holder if we ever need to do anything
    function boardReset() {
    }

    // Determine if a digital pin mode has already been set and if not, does this pin support the mode?
    // Returns true is all tests pass, or false if any one fails.

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
                if( currentMode === mode){
                    return true
                }
                else {
                    connection.send('invalidSetMode/Board ' + boardID + ' Pin ' + pin + ' ' +
                        ' was previously assigned mode ' + currentMode);
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
        connection.send('invalidSetMode/ Board ' + boardID + ' Pin ' + pin + ' does not support the requested mode');
        return false;
    }

    function validateAnalogSetMode(boardID, pin) {
        // check to see if the pin number is in the range of possible analog pins
        var pinMapped = false;
        var i;
        var analogPin;

        if (pin > board.io.analogPins.length) {
            connection.send('invalidSetMode/Analog Board ' + boardID + ' Pin ' + pin +
                ' Exceeds Maximum Number of Analog Pins on Board');
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
            connection.send('invalidSetMode/Analog Board ' + boardID + ' Pin ' + pin +
                ' Pin analogChannel not found');
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