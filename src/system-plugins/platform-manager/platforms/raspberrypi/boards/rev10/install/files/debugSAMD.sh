#!/bin/bash
set -ex

# Select SAMD on the SWD switch
./selectSAMD.sh

# Run OpenOCD GDB server
openocd -f /usr/share/openocd/scripts/board/openrov_trident_samd.cfg