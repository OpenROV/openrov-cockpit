#!/bin/sh
set -e

# Load the config variables for the attached board
. /opt/openrov/cockpit/linux/scripts/get-board-config.sh

echo Hey
echo $BUILD_SCRIPT

# Run the build script
eval $BUILD_SCRIPT

# Run the upload script
eval $UPLOAD_SCRIPT

