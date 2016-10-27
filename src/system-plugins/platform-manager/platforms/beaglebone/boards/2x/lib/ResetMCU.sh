# Setup port
echo 30 > /sys/class/gpio/export
echo out > /sys/class/gpio/gpio30/direction

# Toggle reset pin
echo 0 > /sys/class/gpio/gpio30/value
sleep 0.5
echo 1 > /sys/class/gpio/gpio30/value