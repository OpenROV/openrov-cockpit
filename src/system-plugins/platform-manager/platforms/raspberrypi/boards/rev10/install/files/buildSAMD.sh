#!/bin/bash
set -ex

# Make deploy folder if it doesn't already exist
mkdir -p /opt/openrov/firmware/deploy

# Move into Trident SAMD app dir
cd /opt/openrov/firmware/samd/apps/trident

# Build
make BOARD=openrov-trident-rev10

# Copy final binaries to deploy folder
cp bin/openrov-trident-rev10/trident.hex /opt/openrov/firmware/deploy/samd.bin
cp bin/openrov-trident-rev10/trident.elf /opt/openrov/firmware/deploy/samd.elf