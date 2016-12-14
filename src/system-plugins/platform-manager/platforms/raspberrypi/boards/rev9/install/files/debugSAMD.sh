#!/bin/bash
set -ex

# Run OpenOCD GDB server
openocd -f /usr/share/openocd/scripts/board/openrov_trident_samd.cfg