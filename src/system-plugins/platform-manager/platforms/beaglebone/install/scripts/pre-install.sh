#!/bin/bash
set -x
set -e

# Backup rc.local
cp /etc/rc.local /etc/rc.local_orig

# Create new rc.local that references cockpit's
cat <<__EOF__ > /etc/rc.local
#!/bin/bash -e
#
# rc.local
#
# This script is executed at the end of each multiuser runlevel.
# Make sure that the script will "exit 0" on success or any other
# value on error.
#
# In order to enable or disable this script just change the execution
# bits.
#

# This 
/opt/openrov/system/scripts/rc.local
exit 0
__EOF__

# Create a directory for nginx locations
mkdir -p /etc/nginx/locations-enabled