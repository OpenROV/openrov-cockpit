#!/bin/sh
#
# This script reads the serial number from the i2c-connected eeprom available
# on BeagleBone (Black). It should work both on device-tree and pre-device-tree
# kernels.
#
# The serial number is unique for each BeagleBone (Black) and also includes
# the week/year of manufacture in the first 4 digits.
#
# I only tested this on Ubuntu, but it should probably work on other distros
# as well.
#



notif () {
   echo "${1}${2}"
}

fail () {
   echo "${1}${2}"
   exit 0
}

checks () {
   if ! [ $(id -u) = 0 ]; then
      fail "you need to be root to run this (or use sudo)."
   fi

   has_hexdump=$(which hexdump 2>/dev/null)
   if [ ! "${has_hexdump}" ]; then
      fail "you need to install the BSD utils (apt-get install bsdmainutils)."
   fi
}

print_serial () {

  unset got_eeprom

  #v8 of nvmem...
  if [ -f /sys/bus/nvmem/devices/at24-0/nvmem ] && [ "x${got_eeprom}" = "x" ] ; then
  	eeprom="/sys/bus/nvmem/devices/at24-0/nvmem"
  	got_eeprom="true"
  fi

  #pre-v8 of nvmem...
  if [ -f /sys/class/nvmem/at24-0/nvmem ] && [ "x${got_eeprom}" = "x" ] ; then
  	eeprom="/sys/class/nvmem/at24-0/nvmem"
  	got_eeprom="true"
  fi

  #eeprom...
  if [ -f /sys/bus/i2c/devices/0-0050/eeprom ] && [ "x${got_eeprom}" = "x" ] ; then
  	eeprom="/sys/bus/i2c/devices/0-0050/eeprom"
  	got_eeprom="true"
  fi

  if [ "x${got_eeprom}" = "xtrue" ] ; then

   SERIAL=$(hexdump -e '8/1 "%c"' "${eeprom}" -s 16 -n 12 2>&1)

   if [ "${SERIAL}" = "${SERIAL#*BB}" ]; then
      fail "failed to extract serial number from i2c eeprom: " "${SERIAL}"
   fi

   notif "beaglebone serial number: " "${SERIAL}"
  fi
}
checks
print_serial
