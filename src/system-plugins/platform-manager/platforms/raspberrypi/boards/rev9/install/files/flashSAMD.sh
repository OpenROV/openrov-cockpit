#!/bin/bash
set -ex

# Flash firmware
openocd -f /usr/share/openocd/scripts/board/openrov_trident_samd.cfg -c "program /opt/openrov/firmware/deploy/samd/samd.bin; reset; exit"