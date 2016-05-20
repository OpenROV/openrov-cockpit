[![Views in the last 24 hours](https://sourcegraph.com/api/repos/github.com/OpenROV/openrov-cockpit/counters/views-24h.png)](https://sourcegraph.com/github.com/OpenROV/openrov-cockpit)
[![Build Status](https://secure.travis-ci.org/OpenROV/openrov-cockpit.png?branch=master)](http://travis-ci.org/OpenROV/openrov-cockpit)
[![Scrutinizer Quality Score](https://scrutinizer-ci.com/g/OpenROV/openrov-cockpit/badges/quality-score.png?s=c24130cbf17aaa23f2680e3b45a0ec675ef2037f)](https://scrutinizer-ci.com/g/OpenROV/openrov-cockpit/)
[![Gitter](https://badges.gitter.im/Join Chat.svg)](https://gitter.im/OpenROV/discuss?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

OpenROV Cockpit
================

"[OpenROV](http://openrov.com/) is a DIY telerobotics community centered around underwater exploration & adventure."  One goal of OpenROV is to have onboard video for live viewing as the user operates the ROV.  Enter: OpenROV Cockpit.

The Cockpit project provides the UI and system integration to the hardware of the ROV.  It is a node.js application that is intended to run on the ROV directly that serves a HTML5 Single Page Application to a browser which uses either keyboard, gamepad, or touch to send commands back to the ROV.  

Cockpit provides a socket.io based API for low latency communication with the ROV.

Getting started
---------------

Get a working environment
=========================

*On a beaglebone:*
**If you just getting started and want to have working environment for the OpenROV Cockpit, we recommend that you start with using our lastest stable release as reference from the readme in [openrov-software](https://github.com/OpenROV/openrov-software)**

*On a computer:*
Follow our developer guide:
https://github.com/OpenROV/openrov-software/tree/master/developer_guide

Key Related Projects
----------------

openrov-cockpit is one of serveral packages that are combined together to enable control of an ROV.  Refer to the [openrov-software](https://github.com/OpenROV/openrov-software) for a list of the other pacakges.

Requirements for running without a video abstaction
------------
- USB webcam:  we're using the Genius F100 HD
- mjpg-streamer:  [http://sourceforge.net/projects/mjpg-streamer/](http://sourceforge.net/projects/mjpg-streamer/)
- Node.js :  [http://nodejs.org/](http://nodejs.org/)
- Socket.io:  [http://socket.io/](http://socket.io/)

Plugins
------------
You can create your own plugins and share them with the community. Take a look at our [openrov-grunt-init-plugin](https://github.com/openrov/openrov-grunt-init-plugin) project.  

How to Contribute
------------

1) Fork the project in github

2) Add an issue to the issue list for the changes you want to make.  Browse the issues lists for many of the fixes and enhancement requests if you are looking for ideas.

3) Make your changes and or fixes.

4) Test them locally on your ROV or using the mock framework for node if you don't have one.

5) Send a pull request back to the Master repository.

Someone on the team will review the pull request and ensure the changes work on the ROVs before approving the pull request.

env 'plugins__ui-manager__selectedUI=new-ui' USE_MOCK=true video_port=8092 photoDirectory="/tmp" plugins__video__forward_camera_url="http://localhost:8092/?action=stream" configfile="/tmp/rovconfig.js" forever -w -c 'node --debug' cockpit.js  
