#!/bin/bash
set -x
set -e

# Create soft link for nginx locations
ln -s /opt/openrov/system/etc/nginx.location /etc/nginx/locations-enabled/cockpit.conf

# Add dtoverlay line to config.txt
echo "" >> /boot/config.txt
echo "dtoverlay=openrov-eeprom" >> /boot/config.txt