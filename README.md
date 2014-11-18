Xi
======
The Cross-Platform Interconnect

![ScreenShot](https://raw.github.com/MrYsLab/Xi/master/documentation/XiLogo.png)

Xi allows you to simultaneously connect, monitor and control multiple Arduino, 
BeagleBone Black and Raspberry Pi boards using Scratch 2.0 or Snap! as a graphical user interface.

Installation instructions are provided in the Installation and Usage Guide located in the documentation directory.

### Known Limitations Imposed By The Snap! Team:
None

### Known Limitations Imposed By The Scratch Team:
1. Currently Xi only works with the Scratch 2.0 Online editor.
2. Projects created using Xi cannot be shared on the Scratch cloud.


### Arduino/Device Wiring Information:
1.    [HC-SR04 SONAR Distance Device](https://github.com/rwaldron/johnny-five/blob/master/docs/ping.md)
2.    [Infrared Distance Sensor  - GP2Y0A21YK0F -- Black Wire to ground, White wire to Analog Input Pin](https://www.adafruit.com/products/164)
3.    [4 Wire Stepper Motor](https://learn.adafruit.com/adafruit-arduino-lesson-16-stepper-motors/breadboard-layout)

### BeageBone Black/Device Wiring Information:
1.    [Infrared Distance Sensor](https://raw.github.com/MrYsLab/Xi/master/documentation/BBB_infraredWiring.png)
2.    [Piezo (Tone) Actuator](https://raw.github.com/MrYsLab/Xi/master/documentation/BBB_PiezoWiring.png)
3.    [Servo Motor (Standard and Continuos)](https://raw.github.com/MrYsLab/Xi/master/documentation/BBBservoWiring.png)

NOTE: BeagleBone-IO package needs to be updated to the latest release for Servo support. To update the node modules
to the latest versions, issue the following command while in the xibone directory:

For Linux/Mac:

sudo npm update beaglebone-io

For Windows:

npm update beaglebone-io

### Current Board/Device Support Table
![ScreenShot](https://raw.github.com/MrYsLab/Xi/master/documentation/StatusTable_17Nov14.png)