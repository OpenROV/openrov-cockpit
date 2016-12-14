#!/bin/bash
set -ex

# Select SAMD on the SWD switch
./selectSAMD.sh

# Flash firmware
openocd -f /opt/openrov/system/etc/openocd_samd.cfg -c "program /opt/openrov/firmware/deploy/samd.bin; reset; exit"