#!/bin/sh

# Check to see if board detection was already done, if not run the detection script
if [ ! -f /var/run/rov_board ]; then
    sudo /opt/openrov/cockpit/linux/system-detect.sh
fi

# Get board name
export ROV_BOARD=`cat /var/run/rov_board`

# Temp trident detection
if test grep -q "trident" /opt/board
then
	export UPLOAD_SCRIPT=/opt/openrov/firmware/scripts/samd21/upload.sh
	export BUILD_SCRIPT=/opt/openrov/firmware/scripts/samd21/build.sh
	export MCU_RESET_PIN=50
	export MCU_PROG_PIN=60
	export UPLOAD_REQUIRES_RESET=true
	export UPLOAD_REQUIRES_PROG_PIN=true
	exit 0
fi

# CB25
if test "$ROV_BOARD" = "board25"
then
        export UPLOAD_SCRIPT=/opt/openrov/firmware/scripts/mega2560/upload.sh
        export BUILD_SCRIPT=/opt/openrov/firmware/scripts/mega2560/build.sh
        export MCU_RESET_PIN=30
        export UPLOAD_REQUIRES_RESET=false
        export UPLOAD_REQUIRES_PROG_PIN=false 
        exit 0
fi

# Cape
if test "$ROV_BOARD" = "cape"
then
        export UPLOAD_SCRIPT=/opt/openrov/firmware/scripts/mega328p/upload.sh
        export BUILD_SCRIPT=/opt/openrov/firmware/scripts/mega328p/build.sh
        export MCU_RESET_PIN=32
        export UPLOAD_REQUIRES_RESET=true   
        export UPLOAD_REQUIRES_PROG_PIN=false 
        exit 0
fi

exit 1
