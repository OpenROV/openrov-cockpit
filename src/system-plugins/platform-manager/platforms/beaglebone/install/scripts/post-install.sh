#!/bin/bash
set -x
set -e

# Create soft link for nginx locations
ln -s /opt/openrov/system/etc/nginx.location /etc/nginx/locations-enabled/cockpit.conf
