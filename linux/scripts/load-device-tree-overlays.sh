#!/bin/bash

# Get the cape manager path
CAPEMGR=$( find /sys/devices/ -name bone_capemgr* | head -n 1 )

# Temporary. Eventually replace with EEPROM based solution
if grep -q "trident" /opt/board ; then
  echo OROV-TRIDENT > $CAPEMGR/slots
else
  echo OROV-CB25 > $CAPEMGR/slots
fi

exit 0

