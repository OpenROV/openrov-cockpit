#!/usr/bin/env node

var Installer = function()
{
	
};

Installer.prototype.Install = function()
{
	console.log( "Mock platform doesn't require an install" );
};

Installer.prototype.Uninstall = function()
{
	console.log( "Mock platform has nothing to uninstall" );
};

module.exports = new Installer();