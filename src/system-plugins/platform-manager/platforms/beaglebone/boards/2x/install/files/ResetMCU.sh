#!/bin/bash

sleep 0.25

# Pull reset low
echo 0 > /sys/class/gpio/gpio30

sleep 0.25

# Pull reset high
echo 1 > /sys/class/gpio/gpio30