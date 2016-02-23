#!/bin/bash
set -e

# Load the config variables for the attached board
source /opt/openrov/cockpit/linux/scripts/get-board-config.sh

# Run the ESC flash script provided
if [ ! -z "$ESC_SCRIPT" ] ; then
        eval $ESC_SCRIPT
        exit 0
else
        echo "Board does not support flashing the ESC firmware!"
        exit 1
fi

