#!/bin/bash
set -ex

# Select SAMD on the SWD switch
./selectSAMD.sh

# Flash firmware
openocd -f /usr/share/openocd/scripts/board/openrov_trident_samd.cfg -c "program /opt/openrov/firmware/deploy/samd/samd.bin; reset; exit"