#!/bin/sh
dtc -O dtb -o /lib/firmware/OPENROV-RESET-00A0.dtbo -b 0 -@ /opt/openrov/cockpit/linux/dt-overlays/OPENROV-RESET-00A0.dts

dtc -O dtb -o /lib/firmware/OROV-CB25-00A0.dtbo -b 0 -@ /opt/openrov/cockpit/linux/dt-overlays/OROV-CB25-00A0.dts
dtc -O dtb -o /lib/firmware/OROV-TRIDENT-00A0.dtbo -b 0 -@ /opt/openrov/cockpit/linux/dt-overlays/OROV-TRIDENT-00A0.dts
