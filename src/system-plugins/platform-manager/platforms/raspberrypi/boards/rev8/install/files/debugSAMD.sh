#!/bin/bash
set -ex

# Run OpenOCD GDB server
openocd -f /opt/openrov/system/etc/openocd_samd.cfg