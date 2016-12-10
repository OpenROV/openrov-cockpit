# Setup port
gpio -g mode 18 out

# Toggle reset pin
gpio -g write 18 0
sleep 0.5
gpio -g write 18 1