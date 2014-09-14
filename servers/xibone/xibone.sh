#!/bin/sh
echo "setting current data and time from ntp"
sudo ntpdate -b pool.ntp.org
echo "Starting XiBone server..."
sudo node ~/xibone/xiserver.js bbb

