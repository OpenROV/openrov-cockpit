#!/bin/bash
set -ex

# Set SWD ADDR pins
gpio -g mode 27 out
gpio -g mode 22 out
gpio -g write 22 1
gpio -g write 27 1