#!/bin/bash
set -ex

# Flash firmware
openocd -f /opt/openrov/system/etc/openocd_samd.cfg -c "program /opt/openrov/firmware/deploy/trident-rev8-samd.bin verify; reset; exit"