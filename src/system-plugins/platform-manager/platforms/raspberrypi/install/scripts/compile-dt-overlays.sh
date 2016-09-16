#!/bin/bash
set -xe

dtc -@ -I dts -O dtb -o ./files/dt-overlays/openrov-eeprom.dtbo ./files/dt-overlays/openrov-eeprom.dts