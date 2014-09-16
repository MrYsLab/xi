Xi
======
The Cross-Platform Interconnect

![ScreenShot](https://raw.github.com/MrYsLab/Xi/master/documentation/XiLogo.png)

Xi allows you to simultaneously connect, monitor and control multiple Arduino, 
BeagleBone Black and Raspberry Pi boards using Scratch 2.0 as a graphical user interface.

Installation instructions are provided in the Installation and Usage Guide located in the documentation directory.

### Problems running XiDuino in Windows
If you have not yet downloaded and installed the files, you need not apply any fixes. The problem was fixed
in the latest version of xiduinoinstall.bat

If you have already installed XiDuino for Windows and are getting an error message about Websocket not being found,
download the batch file fixme.bat from the servers/xiduino/windows directory in the distribution, and then run it in a
command window. It will remove the node modules from the directory where they were originally installed and then will
reinstall the modules in your Documents/Xi directory

### Known Limitations Imposed By The Scratch Team:
1. Currently Xi only works with the Scratch 2.0 Online editor.
2. Projects created using Xi cannot be shared on the Scratch cloud.





