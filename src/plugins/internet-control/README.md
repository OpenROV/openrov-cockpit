This plugin is responsible for connecting to the Internet to do realtime sharing of video and data and to receive commands via Internet Control.

It does this by forwarding all traffic from the ROV socket.IO stream up to a webRTC stream and then listening to traffic from the webRTC stream and republishing it in to the ROV socket.IO stream.

The browser is thus bridging the traffic in the background.  Normal communication between the browser and the ROV is unaffected.

This setup allows for conflicting commands to be sent from the cockpit and the internet-control channel.  This module is also responsible for arbitrating those conflicts.

Pre-req
----
