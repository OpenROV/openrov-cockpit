#!/bin/bash
set -ex

# Flash ESCA
selectESCA.sh
sleep 0.2
openocd -f /usr/share/openocd/scripts/board/openrov_trident_pac.cfg -c "program /opt/openrov/firmware/deploy/pac.bin verify; reset; exit"

sleep 0.2

# Flash ESCB
selectESCB.sh
sleep 0.2
openocd -f /usr/share/openocd/scripts/board/openrov_trident_pac.cfg -c "program /opt/openrov/firmware/deploy/pac.bin verify; reset; exit"

sleep 0.2

# Flash ESCC
selectESCC.sh
sleep 0.2
openocd -f /usr/share/openocd/scripts/board/openrov_trident_pac.cfg -c "program /opt/openrov/firmware/deploy/pac.bin verify; reset; exit"
