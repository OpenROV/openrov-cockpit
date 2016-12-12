#!/bin/bash
set -ex

# Set pin mode
gpio -g mode 18 out
sleep 0.25

# Pull reset low
gpio -g write 18 0
sleep 0.25

# Pull reset high
gpio -g write 18 1