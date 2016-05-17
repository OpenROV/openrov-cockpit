#!/bin/bash

# Set up LED variables
if [ -f /sys/class/leds/beaglebone:green:heartbeat/ ]; then
  led0="/sys/class/leds/beaglebone:green:heartbeat"
  led1="/sys/class/leds/beaglebone:green:mmc0"
  led2="/sys/class/leds/beaglebone:green:usr2"
  led3="/sys/class/leds/beaglebone:green:usr3"
else
  led0="/sys/class/leds/beaglebone:green:usr0"
  led1="/sys/class/leds/beaglebone:green:usr1"
  led2="/sys/class/leds/beaglebone:green:usr2"
  led3="/sys/class/leds/beaglebone:green:usr3"
fi

echo none > ${led0}/trigger || true
echo none > ${led1}/trigger || true
echo none > ${led2}/trigger || true
echo none > ${led3}/trigger || true

# Resize root partition if necessary
if [ -f /var/.RESIZE_ROOT_PARTITION ]; then
  rm /var/.RESIZE_ROOT_PARTITION
  touch /var/.RESIZE_ROOT

  echo 255 > ${led0}/brightness || true
  echo 255 > ${led1}/brightness || true
  echo none > ${led2}/trigger || true
  echo none > ${led3}/trigger || true

  /opt/scripts/tools/grow_partition.sh || true
fi

# Add swap file if necessary
if [ ! -f /var/swapfile ]; then
  echo none > ${led0}/trigger || true
  echo 255 > ${led1}/brightness || true
  echo 255 > ${led2}//brightness || true
  echo none > ${led3}/trigger || true

  bash /opt/openrov/cockpit/linux/scripts/add-swap-file.sh
fi

return 0
