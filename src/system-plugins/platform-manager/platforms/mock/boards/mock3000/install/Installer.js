#!/usr/bin/env node

var Installer = function()
{
	
};

Installer.prototype.Install = function()
{	
	console.log( "Installed!" );
};

Installer.prototype.Uninstall = function()
{
	console.log( "Uninstalled!" );
};

module.exports = new Installer();