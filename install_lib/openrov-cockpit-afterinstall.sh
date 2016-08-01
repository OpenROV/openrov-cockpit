#!/bin/bash
set -x
set -e

# Set permissions
chown -R rov /opt/openrov
chgrp -R admin /opt/openrov

# Make scripts executable
chmod -R +x /opt/openrov/system/scripts
