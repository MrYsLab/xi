# This repo is now archived. The xi concept has been incorporated into the [Banyan project](https://mryslab.github.io/python_banyan/) with [JavaScript support](https://github.com/MrYsLab/js-banyan).

Xi
======
## The Cross-Platform Interconnect

![ScreenShot](https://raw.github.com/MrYsLab/Xi/master/documentation/drawings/XiLogo.png)

Xi allows you to simultaneously connect, monitor and control multiple Arduino, 
BeagleBone Black and Raspberry Pi boards using Scratch 2.0 or Snap! as a graphical user interface.

Installation instructions are provided in the Installation and Usage Guide located in the documentation directory.

French Block and Alert Translations provided by Seb Canet

Translators Guide can be found in the Documentation Directory.

### Known Limitations Imposed By The Snap! Team:
None

### Known Limitations Imposed By The Scratch Team:

Currently Xi works only on Chrome for Ubuntu (and perhaps other linux flavors). After launching the Xi server for your board, go to:
[http://scratchx.org/?url=http://MrYsLab.github.io/xi4s.js](http://scratchx.org/?url=http://MrYsLab.github.io/xi4s.js)

This is the new Scratch Extension Web Site. After it launches, wait a moment and a dialog box will appear to allow
you to continue with loading the extension.

Accept the warning and the Xi blocks will load.

You may see another warning stating there is an extension problem and that a plug-in needs to be loaded. Just click OK to dismiss 
this dialog box. Xi does not use the Scratch plugins, but uses the Xi servers.

For a French translation use this URL:
[http://scratchx.org/?url=http://MrYsLab.github.io/xi4s_fr4.js](http://scratchx.org/?url=http://MrYsLab.github.io/xi4s_fr4.js)

### Arduino/Device Wiring Information:
1.    [HC-SR04 SONAR Distance Device](https://github.com/rwaldron/johnny-five/blob/master/docs/ping.md)
2.    [Infrared Distance Sensor  - GP2Y0A21YK0F -- Black Wire to ground, White wire to Analog Input Pin](https://www.adafruit.com/products/164)
3.    [4 Wire Stepper Motor](https://learn.adafruit.com/adafruit-arduino-lesson-16-stepper-motors/breadboard-layout)

### BeageBone Black/Device Wiring Information:
1.    [Infrared Distance Sensor](https://raw.github.com/MrYsLab/Xi/master/documentation/drawings/BBB_infraredWiring.png)
2.    [Piezo (Tone) Actuator](https://raw.github.com/MrYsLab/Xi/master/documentation/drawings/BBB_PiezoWiring.png)
3.    [Servo Motor (Standard and Continuous)](https://raw.github.com/MrYsLab/Xi/master/documentation/drawings/BBBservoWiring.png)


NOTE: BeagleBone-IO package needs to be updated to the latest release for Servo support. To update the node modules
to the latest versions, issue the following command while in the xibone directory:

sudo npm update beaglebone-io


### Raspberry Pi/Device Wiring Information:
1.    [Servo Motor (Standard and Continuous)](https://raw.github.com/MrYsLab/Xi/master/documentation/drawings/RPiServoWiring.png)
2.    [Single Power Supply Servo Motor (Standard and Continuous)](https://raw.github.com/MrYsLab/Xi/master/documentation/drawings/RPiServoWiring2.png)

NOTE: Raspberry-IO package needs to be updated to the latest release for Servo support. To update the node modules
to the latest versions, issue the following command while in the xipi directory:

sudo npm rm raspi-io
sudo npm install raspi-io

The pin numbering scheme for the Raspberry Pi follows the wiringPI pin numbering scheme. So for PWM or Servo, the Pin number to
use in the Scratch Block would be 1, even though the physical pin number is 12.

Please refer to the [Raspi-IO Pin Map](https://github.com/bryan-m-hughes/raspi-io/wiki).


### Current Board/Device Support Table
![ScreenShot](https://raw.github.com/MrYsLab/Xi/master/documentation/drawings/StatusTable_31Dec14.png)
