
rem XiDuino for Windows install script

echo on

echo "creating a xi directory for the user"
mkdir "%userprofile%"\Documents\xi

echo "copying files to the xi directory"
copy xiduino.bat "%userprofile%"\Documents\xi
copy xiduino4Snap.bat "%userprofile%"\Documents\xi
copy ..\..\xiserver\xiserver.js "%userprofile%"\Documents\xi
copy xi.ico "%userprofile%"\Documents\xi
copy ..\..\..\clients\scratch\projects\Xi4S_Starter_Project.sb2 "%userprofile%"\Documents\xi
copy ..\..\..\documentation\Xi_Install_and_Usage_Guide.pdf "%userprofile%"\Documents\xi

echo "installing node.js modules"
call npm install --prefix "%userprofile%"\Documents\xi node-gyp
call npm install --prefix "%userprofile%"\Documents\xi johnny-five
call npm install --prefix "%userprofile%"\Documents\xi websocket
call npm install --prefix "%userprofile%"\Documents\xi open
echo "!!!! Install Complete !!!"
echo






