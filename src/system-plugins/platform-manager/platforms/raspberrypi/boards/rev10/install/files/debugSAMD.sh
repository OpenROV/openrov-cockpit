#!/bin/bash
set -ex

# Select SAMD on the SWD switch
./selectSAMD.sh

# Run OpenOCD GDB server
openocd -f /opt/openrov/system/etc/openocd_samd.cfg