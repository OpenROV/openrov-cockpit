[![Gitter](https://badges.gitter.im/Join Chat.svg)](https://gitter.im/OpenROV/discuss?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![bitHound Overall Score](https://www.bithound.io/github/OpenROV/openrov-cockpit/badges/score.svg)](https://www.bithound.io/github/OpenROV/openrov-cockpit)

# [OpenROV](http://openrov.com/) Cockpit

The Cockpit is the UI and control systems for any remote operated vehicle or device.  It is the heart of the OpenROV series of Underwater Robots.  
Built on the latest and greatest web standards, Cockpit works with embedded Linux and micro-controllers to provide tele-robotic control of those systems.  

## Key Features
* Connect to cockpit on mobile, desktops, and tablets, no installation required
* In browser near real-time h.264/MJPEG video viewing with sub 120ms latency
* Gamepad, keyboard, and joystick control (fully configurable)
* Gyro/Accelerometer stabilized flight controls 
* GPU based video filters and computer augmented video
* Fully extensible plugin based architecture
* Community supported themes and plugins
* In browser recording and playback of video and sensor telemetry
* Support for language translations
* Backup of data and video to the cloud
* Notification and control of system upgrades
* Built in configurations for many ROV motor configurations
* Peer to Peer distribution of real-time video and control
* Live streaming of video and data
* And MUCH MUCH more


# Getting started
The fastest way to see the software running if your don't already have it installed on a robot is to follow [these](docs/DEV-HOWTO.md) instructions to get it running on your local computer.

# Branches and Tags
Branches:

* Master : This is the latest code as it is being developed. We will do our best to make sure this is up and running through automated testing before we merge changes.  All changes are done in seperate branches/forks and merged.

* dev-stable: This is the latest cut from Master where we have actually run the code on a phyiscal ROV through our testing checklist.  Be sure to read the release notes for known issues.

* feature/[name] : These are feature branches that are being worked on by teams at OpenROV.

* bug/[id] : These are bug branches for quick bug fixes

Tags:
(subject to change)
* v[version] : These are offical releases
* release/[named-release] : ex NewCamera2016DevImage, are specific releases that were not targeted twoards the general public.  There may have been trade offs where the code only works in certian configurations.

# Related Projects

openrov-cockpit is one of several packages that are combined together to enable control of an ROV.  Refer to the [openrov-software](https://github.com/OpenROV/openrov-software) for a list of the other packages.

### Requirements to run locally (vs embedded on a robot)
- USB webcam:  UVC compatible camera that supports MJPEG compression
- mjpg-streamer:  [http://sourceforge.net/projects/mjpg-streamer/](http://sourceforge.net/projects/mjpg-streamer/)
- ffmpeg: (to simulate the h.264 video pipeline)
- Node.js:  [http://nodejs.org/](http://nodejs.org/)

For embedding in the robotic system, openrov-cockpit is typically installed with several other packages that also include drivers and configuration for various hardware solutions.  We provide images for the OpenROV products. If you have questions about installing on other devices, reach out to us on Gitter or the [OpenROV Forums](http://forum.openrov.com).


# How to Contribute

Review the 
* [Dev-HowTo](docs/DEV-HOWTO.md)
* [Issues List](https://github.com/openrov/openrov-software/issues)
* [Creating Plugins](docs/CREATING-PLUGINS.md)

Filing issues: We have centralized all issues in the umbrella [openrov-software project](https://github.com/openrov/openrov-software/issues)

> Contributions come in all forms, from creating features, fixing bugs, creating documentation, translating languages, writing tests, testings, etc... if you want to help and are not sure how, reach out to us on gitter.

1) Fork the project in github

2) Add an issue to the issue list for the changes you want to make.  Browse the issues lists for many of the fixes and enhancement requests if you are looking for ideas.

3) Make your changes and or fixes.

4) Test them locally on your ROV or using the mock framework for node if you don't have one.

5) Send a pull request back to the Master repository.

Someone on the team will review the pull request and ensure the changes work on the ROVs before approving the pull request.

* Currently developed and tested against Chrome, but should work with Firefox.  Looking for testers to check Edge and Safari.

...
