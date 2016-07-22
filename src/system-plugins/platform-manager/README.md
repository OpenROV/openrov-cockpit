# openrov-pal
Platform abstraction layer that marries hardware/OS specific scripts to core functions on supported OpenROV computer systems

Directory structure

- platforms
	- <cpu type> (ex: raspi, bbb)
		- config (contains json data about the cpu)
		- dt-overlays (device tree overlay source files)
		- boards (contains scripts/source and config information required for each supported controllerboard)
			- <boardType> (ex: trident, cb25, cape)
				- pinmap.json (pin map for this cpu+controllerboard combination)
				- detect.js (method used to determine if this board is currently attached)
				- functions.js (core functions available to this cpu+controllerboard combination, like build & upload firmware, reset mcu, etc)
		- scripts (any shell scripts used by the system)
		- services (any service/init files used by the system, like rc.local, openrov.service, etc)
		- src (all supporting javascript source to provide standard board functionality)
			- setup.js (detects controllerboard type, loads core functionality, composites functions and config into "platform" object)
