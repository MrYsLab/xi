#!/bin/sh
# XiPi install script
echo "Installing XiPi ..."
echo
echo "creating xipi directory"
mkdir -p ~/xipi

echo "change permissions on xibone.sh"
sudo chmod ugo+x ./xipi.sh

echo "copying xiduino.sh"
cp ./xipi.sh ~/xipi/.

echo "copying xiserver.js"
cp ../xiserver/xiserver.js ~/xipi/.

echo "Installing npm modules for XiPi"

echo "loading node-gyp"
npm install --prefix ~/xipi node-gyp

echo "loading johnny-five"

npm install --prefix ~/xipi johnny-five

echo "loading raspi-io"

npm install --prefix ~/xipi raspi-io

echo "loading websocket"

npm install --prefix ~/xipi websocket

echo "loading open"
npm install --prefix ~/xipi open

echo "!!!! Install Complete !!!"
echo
echo
echo "To start XiPi: "
echo "  cd ~/xipi"
echo "  bash xipi.sh"
echo
echo "You may be prompted for sudo priveleges".
