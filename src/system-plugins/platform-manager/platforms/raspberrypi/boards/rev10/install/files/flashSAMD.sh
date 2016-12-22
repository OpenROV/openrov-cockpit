#!/bin/bash
set -ex

# Select SAMD on the SWD switch
./selectSAMD.sh

# Flash firmware
openocd -f /opt/openrov/system/etc/openocd_samd.cfg -c "program /opt/openrov/firmware/deploy/trident-rev10-samd.bin verify; reset; exit"