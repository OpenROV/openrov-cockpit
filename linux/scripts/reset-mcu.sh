#!/bin/bash
set -e

# Load the config variables for the attached board
source /opt/openrov/cockpit/linux/scripts/get-board-config.sh

echo "Initiating MCU Reset..."

echo 0 > $MCU_RESET_PIN

sleep 0.25

echo 1 > $MCU_RESET_PIN

echo "MCU reset!"

