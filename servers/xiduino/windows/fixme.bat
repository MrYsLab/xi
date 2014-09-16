

echo "loading node-gyp"

call npm rm -g node-gyp

echo "loading johnny-five"

call npm rm -g johnny-five

echo "loading websocket"

call npm rm -g websocket

echo "loading open"

call npm rm -g open

echo "cleaning npm cache"
call npm -g cache clean

call npm install --prefix "%userprofile%"\Documents\xi node-gyp
call npm install --prefix "%userprofile%"\Documents\xi johnny-five
call npm install --prefix "%userprofile%"\Documents\xi websocket
call npm install --prefix "%userprofile%"\Documents\xi open