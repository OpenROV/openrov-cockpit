for i in "$@"
do
case $i in
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

FILE_PATH=/opt/openrov/firmware/bin/${BOARD_ID}/${SKETCH_NAME}.bin

openocd -f ../../config/openocd.cfg -c "program ${FILE_PATH}; reset; exit"
