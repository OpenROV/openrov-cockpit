#!/bin/bash

for i in "$@"
do
case $i in
    --hardware-path=*)
    HARDWARE_DIR="${i#*=}"
    shift # past argument=value
    ;;
    --toolchain-path=*)
    TOOLCHAIN_DIR="${i#*=}"
    shift # past argument=value
    ;;
	--samdlib-path=*)
    SAMD_LIBS_DIR="${i#*=}"
    shift # past argument=value
    ;;
	--sharedlib-path=*)
    SHARED_LIBS_DIR="${i#*=}"
    shift # past argument=value
    ;;
	--fqbn=*)
    FQ_BOARDNAME="${i#*=}"
    shift # past argument=value
    ;;
	--board-product-id=*)
    BOARD_ID="${i#*=}"
    shift # past argument=value
    ;;
	--sketchname=*)
    SKETCH_NAME="${i#*=}"
    shift # past argument=value
    ;;
    *)
            # unknown option
    ;;
esac
done

BIN_DIR=/opt/openrov/firmware/bin/${BOARD_ID}/
SOURCE_FILE=/opt/openrov/firmware/sketches/${SKETCH_NAME}/${SKETCH_NAME}.ino

mkdir -p ${BIN_DIR}

# Create temp build directory
mkdir /opt/openrov/firmware/build
BUILD_DIR=/opt/openrov/firmware/build

# Run build command
arduino-builder -verbose -compile -build-path ${BUILD_DIR} -hardware ${HARDWARE_DIR} -tools ${TOOLCHAIN_DIR} -libraries ${SHARED_LIBS_DIR} -libraries ${SAMD_LIBS_DIR} -fqbn ${FQ_BOARDNAME} ${SOURCE_FILE}

if [ $? -eq 0 ]
then
        echo "Successfully built firmware!"
        RET=0

        # Copy the compiled .bin file to the bin directory
        cp ${BUILD_DIR}/${SKETCH_NAME}.ino.bin ${BIN_DIR}/${SKETCH_NAME}.bin
        cp ${BUILD_DIR}/${SKETCH_NAME}.ino.elf ${BIN_DIR}/${SKETCH_NAME}.elf
		
		echo "Copied ${SKETCH_NAME}.bin to ${BIN_DIR}!"
else
        echo "Firmware build failed!"
        RET=1
fi

# Delete the temporary build folder
rm -rf ${BUILD_DIR}

# Finished successfully
exit ${RET}
