#!/bin/sh
# XiDuino NPM modules install script

echo "Installing XiDuino ..."
echo
echo "creating xiduino directory"
mkdir -p ~/xiduino

echo "change permissions on xiduino.sh"
sudo chmod ugo+x ./xiduino.sh

echo "copying xiduino.sh"
cp ./xiduino.sh ~/xiduino/.

echo "copying xiserver.js"
cp ../../xiserver/xiserver.js ~/xiduino/.

echo "Installing npm modules for Xiduino"
echo "loading node-gyp"
npm install --prefix ~/xiduino node-gyp

echo "loading johnny-five"
npm install --prefix ~/xiduino johnny-five

echo "loading open"
npm install --prefix ~/xiduino open

echo "loading websocket"

npm install --prefix ~/xiduino websocket

echo "!!!! Install Complete !!!"
echo
echo
echo "To start XiDuino: "
echo "  cd ~/xiduino"
echo "  bash xiduino.sh"
echo
echo "You may be prompted for sudo priveleges".

