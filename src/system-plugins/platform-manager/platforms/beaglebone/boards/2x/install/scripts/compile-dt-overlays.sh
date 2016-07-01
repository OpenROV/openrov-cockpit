#!/bin/bash
set -xe

dtc -O dtb -o ./files/dt-overlays/OPENROV-RESET-00A0.dtbo -b 0 -@ ./files/dt-overlays/OPENROV-RESET-00A0.dts
dtc -O dtb -o ./files/dt-overlays/OROV-CB25-00A0.dtbo -b 0 -@ ./files/dt-overlays/OROV-CB25-00A0.dts