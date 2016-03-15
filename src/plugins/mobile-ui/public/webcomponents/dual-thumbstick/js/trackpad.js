var Trackpad = function ()
{
	this.id 					= -1;
	this.currentPos 			= new Vector2( 0, 0 );
	this.startPos 				= new Vector2( 0, 0 );
	this.vec 					= new Vector2( 0, 0 );
	this.drawPos				= new Vector2( 0, 0 );
	this.canvasPos				= new Vector2( 0, 0 );
	
	this.size 					= 40;
	this.originSizePercentage 	= 0.1;
	this.padSizePercentage 		= 0.1;
	this.padSize				= this.size * this.padSizePercentage;
	this.axisColor				= "black";
	this.padColor				= "red";
		
	this.xPadding				= 100;
	this.yPadding				= 14;
	
	this.hasXAxis				= true;
	this.hasYAxis				= true;
	
	this.xOutInverted			= 1;
	this.yOutInverted			= -1;
	
	this.isVisible				= false;
	
	this.x						= 0;
	this.y						= 0;
	
	this.xLast					= 0;
	this.yLast					= 0;
	
	this.xHasChanged			= true;
	this.yHasChanged			= true;
};

Trackpad.prototype =
{
	Reset: function()
	{
		this.xHasChanged			= true;
		this.yHasChanged			= true;
		
		this.currentPos 			= new Vector2( 0, 0 );
		this.startPos 				= new Vector2( 0, 0 );
		this.vec 					= new Vector2( 0, 0 );
		
		this.isVisible				= false;
		this.id 					= -1;
		
		this.x						= 0;
		this.y						= 0;
	},
	
	Update: function()
	{
		var x0 = this.startPos.x;
		var y0 = this.startPos.y;
		
		if( this.hasXAxis )
		{
			if( Math.abs( this.vec.x ) > this.size )
			{
				// Cap value to size
				x0 =  0 + this.size * ( this.vec.x / Math.abs( this.vec.x ) );
			}
			else
			{
				x0 = 0 + this.vec.x;
			}
		}
		else
		{
			x0 = 0;
		}
		
		if( this.hasYAxis )
		{
			if( Math.abs( this.vec.y ) > this.size )
			{
				// Cap value to size
				y0 =  0 + this.size * ( this.vec.y / Math.abs( this.vec.y ) );
			}
			else
			{
				y0 = 0 + this.vec.y;
			}
		}
		else
		{
			y0 = 0;
		}
			
		this.x = this.xOutInverted * ( x0 / this.size );
		this.y = this.yOutInverted * ( y0 / this.size );
		
		this.xHasChanged = ( this.xLast != this.x );
		this.yHasChanged = ( this.yLast != this.y );
		
		// Set output values
		this.xLast = this.x;
		this.yLast = this.y;
	},
	
	Render: function( ctx )
	{
		if( this.isVisible )
		{
			this.Update();
			
			// Draw outer crosshair
			ctx.beginPath();
			ctx.strokeStyle = this.axisColor;
			ctx.lineWidth = 2; 
			
			if( this.hasYAxis )
			{
				ctx.moveTo( this.drawPos.x, this.drawPos.y - this.size );
				ctx.lineTo( this.drawPos.x, this.drawPos.y + this.size );
			}
			
			if( this.hasXAxis )
			{
				ctx.moveTo( this.drawPos.x - this.size, this.drawPos.y );
				ctx.lineTo( this.drawPos.x + this.size, this.drawPos.y );
			}
			
			ctx.stroke();
			
			// Draw origin
			ctx.beginPath();
			ctx.strokeStyle = this.axisColor;
			ctx.lineWidth = 4; 
			
			ctx.moveTo( this.drawPos.x, this.drawPos.y - ( this.size * this.originSizePercentage ) );
			ctx.lineTo( this.drawPos.x, this.drawPos.y + ( this.size * this.originSizePercentage ) );
			ctx.moveTo( this.drawPos.x - ( this.size * this.originSizePercentage ), this.drawPos.y );
			ctx.lineTo( this.drawPos.x + ( this.size * this.originSizePercentage ), this.drawPos.y );
			
			ctx.stroke();
	
			// Draw pad
			var xPos = this.drawPos.x + this.x * this.size * this.xOutInverted;
			var yPos = this.drawPos.y + this.y * this.size * this.yOutInverted;
			
			ctx.fillStyle = this.padColor;
			ctx.beginPath(); 
			ctx.arc( xPos, yPos, this.padSize, 0, Math.PI * 2 , true ); 
			ctx.fill();
			
			// Draw ticks
			if( this.hasXAxis && this.hasYAxis )
			{
				ctx.beginPath();
				ctx.strokeStyle = this.padColor;
				ctx.lineWidth = 2; 
				
				ctx.moveTo( this.drawPos.x - ( this.size * this.originSizePercentage ), yPos  );
				ctx.lineTo( this.drawPos.x + ( this.size * this.originSizePercentage ), yPos  );
				
				ctx.moveTo( xPos, this.drawPos.y - ( this.size * this.originSizePercentage ) );
				ctx.lineTo( xPos, this.drawPos.y + ( this.size * this.originSizePercentage )  );
				ctx.stroke();
			}
			
			// Render thumb circles
			ctx.beginPath(); 
			ctx.strokeStyle = this.axisColor; 
			ctx.lineWidth = 6; 
			ctx.arc(this.startPos.x - this.canvasPos.x, this.startPos.y - this.canvasPos.y, this.size,0,Math.PI*2,true); 
			ctx.stroke();

			ctx.beginPath(); 
			ctx.strokeStyle = this.axisColor; 
			ctx.arc(this.currentPos.x - this.canvasPos.x, this.currentPos.y - this.canvasPos.y, this.size * 0.5, 0,Math.PI*2, true); 
			ctx.stroke(); 
		}
	}
};