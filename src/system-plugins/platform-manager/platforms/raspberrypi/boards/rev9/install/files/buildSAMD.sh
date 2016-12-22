#!/bin/bash
set -ex

# Make deploy folder if it doesn't already exist
mkdir -p /opt/openrov/firmware/deploy

# Move into Trident SAMD app dir
cd /opt/openrov/firmware/samd/apps/trident

# Build
make -j BOARD=openrov-trident-rev9

# Copy final binaries to deploy folder
cp bin/openrov-trident-rev9/trident.hex /opt/openrov/firmware/deploy/trident-rev9-samd.bin
cp bin/openrov-trident-rev9/trident.elf /opt/openrov/firmware/deploy/trident-rev9-samd.elf