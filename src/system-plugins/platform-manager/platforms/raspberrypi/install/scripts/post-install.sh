#!/bin/bash
set -x
set -e

# Create soft link for nginx locations
ln -s /opt/openrov/system/etc/nginx.location /etc/nginx/locations-enabled/cockpit.conf

# Add dtoverlay line to config.txt
python /opt/openrov/system/scripts/build_tags/build_tags.py -f /boot/config.txt -t "#OPENROV" add --text "dtoverlay=openrov-eeprom"