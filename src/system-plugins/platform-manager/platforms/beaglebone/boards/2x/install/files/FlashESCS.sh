#!/bin/bash
set -e

if [ ! -d "/opt/openrov/firmware/bin/afro" ]; then
  echo "Cannot find the afro_esc firmware project. Make sure it has been installed."
  exit 1
fi

avrdude -p m8 -b 19200 -P /dev/ttyO1 -c avrispv2 -e -U flash:w:/opt/openrov/firmware/bin/afro/afro_nfet.hex:i -vv
stty -F /dev/ttyO1 raw 19200
echo -n "\$M<P52" > /dev/ttyO1
avrdude -p m8 -b 19200 -P /dev/ttyO1 -c avrispv2 -e -U flash:w:/opt/openrov/firmware/bin/afro/afro_nfet.hex:i -vv
echo -n "\$M<P53" > /dev/ttyO1
avrdude -p m8 -b 19200 -P /dev/ttyO1 -c avrispv2 -e -U flash:w:/opt/openrov/firmware/bin/afro/afro_nfet.hex:i -vv