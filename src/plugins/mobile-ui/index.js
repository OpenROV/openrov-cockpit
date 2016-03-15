function mobileUi( name, deps ) 
{
	console.log( 'Mobile UI plugin loaded.' );
	
	this.plugin =
	{
		name: "mobile-ui",
		type: "theme"
	};
	
	deps.app.get('/mobile-ui', function(req, res) {
		var view =  __filename.substring(0, __filename.lastIndexOf("/")) + '/' + req.query.page + '.ejs';
		
		console.log( "SOMETHING123");
		console.log( view );
		
		var pageInfo = deps.pathInfo();
		
		res.render( view, 
		{
	        title: 'OpenROV Cockpit',
	    	scripts: pageInfo.scripts,
	    	styles: pageInfo.styles,
	    	sysscripts: pageInfo.sysscripts,
	    	config: deps.config
      	} );
  	});
}

module.exports = function( name,deps )
{
  return new mobileUi( name, deps );
};
