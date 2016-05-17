for i in "$@"
do
case $i in
	--pin=*)
    PIN="${i#*=}"
    shift # past argument=value
    ;;
    *)
            # unknown option
    ;;
esac
done

# Set pin mode
gpio -g mode ${PIN} out

sleep 0.25

# Pull reset low
gpio -g write ${PIN} 0

sleep 0.25

# Pull reset high
gpio -g write ${PIN} 1
