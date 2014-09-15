
rem XiDuino for Windows install script

echo on

echo "creating a xi directory for the user"
mkdir "%userprofile%"\Documents\xi

echo "copying files to the xi directory"
copy xiduino.bat "%userprofile%"\Documents\xi
copy ..\..\xiserver\xiserver.js "%userprofile%"\Documents\xi
copy xi.ico "%userprofile%"\Documents\xi
copy ..\..\..\clients\scratch\projects\Xi4S_Starter_Project.sb2 "%userprofile%"\Documents\xi
copy ..\..\..\documentation\Xi_Install_and_Usage_Guide.pdf "%userprofile%"\Documents\xi

echo "cleaning npm cache"
call npm -g cache clean

echo "loading node-gyp"

call npm install -g node-gyp

echo "loading johnny-five"

call npm install -g johnny-five

echo "loading websocket"

call npm install -g websocket

echo "loading open"

call npm install -g open

echo "!!!! Install Complete !!!"
echo






