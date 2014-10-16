/**
* Provided under the MIT License (c) 2014
* See LICENSE @file for details.
*
* @file Lib.js
*
* @author juanvallejo
* @date 10/7/14
*
* Canvas animation library. Consists of three separate 'method modules' that define methods specific
* to the Lib object, spritesheet objects, canvas line objects, and canvas rectangle objects.
* Such events are separated for modularity and readability in one file. Shared methods are functions that
* are general enough to apply to all three types of Lib.js objects.
*
* Note: Include important notes on program here.
*
* Important: Include anything needed to run / dependencies required here.
**/

(function() {
/**
 * holds global 'window' event data
**/
var Events = {
	resize:[]
};

/**
 * Main loop using frame-by-frame animation method. Defaults to setTimeout fallback if API not present.
 * Also defines time values needed for frame animation
 *
 * @param a = {Function} function to be looped
**/
var frame = (function() {
	return window.requestAnimationFrame || 
		   window.mozRequestAnimationFrame ||
		   window.webkitRequestAnimationFrame ||

		   //fallback method for animation loop
		   function t(a) {
				setTimeout(a,1000/60);
			};
})(),time = {
	dt:null,													// difference in time between last timestamp and current timestamp
	now:Date.now(),												// current timestamp in milliseconds
	last:Date.now(),											// last recorded timestamp in milliseconds
	ellapsed:0													// time ellapsed in milliseconds since animation started

// holds data for debugging and resetting animation settings,
// as well as log data
},debug = {
	_reset:false,												// indicates that library settings have been reset
	_mainCalled:false,											// indicates that library animation has started
	_eventsInit:false,											// indicates that library events have been initialized
	_indexCountInit:false,										// indicates that at least one user object has been created
	_paused:false,												// tells library to pause animation loop
	log:false,													// tells library to log debug data to console
	logfps:false,												// tells library to output frames-per-second data
	runAnimation:true,											// tells library to animate sprites
	useSingleCanvasMode:false									// tells library to pretend only one canvas will ever be used
};

/**
 * Holds setting information for each sprite object; includes image url, size, and animation settings
 * Treated as Object.class, meant to be instantiated, not used statically
 *
 * @param url 		= {String}	path/to/image/location
 * @param size 		= {Array} 	[width, height] of each sprite-sheet 'frame'. Must be provided by the user
 * @param frequency = {Integer} framerate for the sprite animation loop
 * @param position 	= {Array} 	of coordinates setting the position on the sprite sheet
 * @param direction = {String} 	('horizontal' | 'vertical') ... indicates whether to move vertically or horizontally across sprite sheet
 * @param frames 	= {Array} 	tells library which frames to display and in what order
 * @param canvas 	= {Canvas}	canvas object to draw sprite to
**/
function Sprite(url, size, frequency, position, direction, frames, canvas) {

	this._index = 0;											// sum of all framerates since animation began
	this.canvas = canvas;										// canvas object to draw spritesheet to
	this.dir = direction || 'horizontal';						// direction to move accross spritesheet (horizontal | vertical)
	this.frames = frames;										// frame sequence to display
	this.frequency = frequency || 0;							// rate of spritesheet animation (0 for static image)
	this.height;												// holds dynamically computed heigth value; used with scaling
	this.pos = position || [0,0];								// position of current frame
	this.runAnimation = true;									// flag (true | false) to force sprite into static mode
	this.reverseAnimation = false;								// play current frame sequence in reverse order if set to true
	this.scale = false;											// flag (true | false) tells library whether frame is to be scaled
	this.size = size;											// size of each sprite image in the spritesheet
	this.url = url;												// location of resource to use as spritesheet image
	this.width;													// holds dynamically computed width value; used with scaling
};

/**
 * Updates the _index field of the spritesheet by increasing its value by the difference between
 * the current frame and the last frame. This is used to calculate the current frame on the
 * spritesheet. 
 *
 * @param dt = {Float} difference in time between last frame and current frame
**/
Sprite.prototype.update = function(dt) {
	this._index += this.frequency * dt;
};

/**
 * Updates the _index field of the spritesheet by increasing its value by the difference between
 * the current frame and the last frame. This is used to calculate the current frame on the
 * spritesheet. 
 *
 * @param ctx = 2D Canvas rendering context
**/
Sprite.prototype.render = function(ctx) {
	var max = this.frames.length;								// max number of frames to display
	var idx = Math.floor(this._index);							// current frame number to fetch from array
	var frame = this.frames[idx % max];							// position offset from spritesheet sprites
	var x = this.pos[0];										// x position of current sprite on spritesheet
	var y = this.pos[1];										// y position of current sprite on spritesheet

	if(!this.runAnimation) {
		if(this.reverseAnimation) {
			frame = this.frames.length - 1;
		} else {
			frame = 0;
		}
	}

	if(this.dir == 'horizontal') {
		x += this.size[0] * frame;								// calculates x coord of sprite based on frame width and offset
	} else {
		y += this.size[1] * frame;								// calculates y coord of sprite based on frame height and offset
	}

	var width = this.size[0];									// save the width of the current frame in order to modify it
	var height = this.size[1];									// save the width of the current frame in order to modify it

	if(this.scale) {
		width *= this.scale;									// adjust the width according to scale value defined by user
		height *= this.scale;									// adjust the height according to scale value defined by user

		this.width = width;										// save scaled width separate from original width
		this.height = height;									// save scaled height separate from original height
	}

	//draw the spritesheet [clipped to the current frame] to the canvas
	ctx.drawImage(Lib.resources[this.url], x, y, this.size[0], this.size[1], 0, 0, width, height);
};

/**
 * Main library. Static object containing methods, definitions, and settings for all animations
 * Event methods are separated into sections based on the major types of objects Lib.js supports,
 * including lines, rectangles, sprites / static images, and the library itself.
**/
var Lib = {
	canvas:null,												// holds last assigned canvas object
	canvases:[],												// holds array of every canvas object assigned
	canvasEvents:{
		click:[]												// holds functions to be called when main canvas is clicked
	},
	ctx:null,													// holds 2D context of last assigned canvas object							
	customevents:{},
	detached:[],
	entities:{},
	entityExists:{},
	entityReadyEvents:{},
	eventQueue:{},
	extensions:{},
	externalRenderings:[],
	id:null,
	inputRules:[],
	keys:{},
	loaded:false,
	objects:[],
	offset:{
    	x:0,													// holds the current [screen] offset
    	y:0
    },	
	pending:{length:0},
	readyEvents:[],
	resources:{},
	spriteEvents:{
		attach:function() {
			//Looks to see if object is detached by checking if a
			// ._detachIndex has been assigned
			if(this._detachIndex) {
				// removes object from global array of detached objects
				// 1 must be subtracted as detachIndex is always 1 + object's position in array
				Lib.detached.splice(this._detachIndex - 1, 1);

				this._detachIndex = null;						// sets the detach index for current object to none
			} else {
				console.log('Lib.attach error: object \''+this.id+'\' is not already detached');
			}
		},
		detach:function() {
			// adds the current sprite object to global
			// array of detached objects
			Lib.detached.push(this);

			this._detachIndex = Lib.detached.length;			// sets object's detachIndex to its position on array + 1
            Lib.detached.storedX = this.getX();					// saves the current x position of the detached object
            Lib.detached.storedY = this.getY();					// saves the current y position of the detached object
		},
        setOffsetX:function(a){
            Lib.offset.x = a;
        },
        setOffsetY:function(a){
            Lib.offset.y = a;
        },
        getID:function() {
			return this.id;
		},
        getSize:function() {
        	return this.size;
        },
        getPosition:function() {
        	return this.settings.position;
        },
        getAnimationStatus:function() {
        	return this.spritesheet.reverseAnimation;
        },
        getSpeed:function() {
        	return this.settings.speed;
        },
        getFrequency:function() {
        	return this.settings.frequency;t
        },
        getDetachedX:function() {
			return this.x + Lib.offset.x;
		},
		getDetachedY:function() {
			return this.y + Lib.offset.y;
		},
        getOffsetX:function(){
            return Lib.offset.x;
        },
        getOffsetY:function(){
            return Lib.offset.y;
        },
		increaseOffsetX:function(a) {
			if(a) Lib.offset.x += (this.speed * time.dt) * a;
			else Lib.offset.x += this.speed * time.dt;
		},
		increaseOffsetY:function(a) {
			if(a) Lib.offset.y += (this.speed * time.dt) * a;
			else Lib.offset.y += this.speed * time.dt;
		},
		decreaseOffsetX:function(a) {
			if(a) Lib.offset.x -= (this.speed * time.dt) * a;
			else Lib.offset.x -= this.speed * time.dt;
		},
		decreaseOffsetY:function(a) {
			if(a) Lib.offset.y -= (this.speed * time.dt) * a;
			else Lib.offset.y -= this.speed * time.dt;
		},
        isDetached:function(){
            return (this._detachIndex ? true : false);
        },
        render:function(a) {
        	if(typeof a == 'function') this.renderings.push(a);
        	else throw 'Parameter must be a function for this method.';
        },

        /**
         * Assigns a specified click action to current sprite object by adding it to
         * the object's key-entry array in the library's eventQueue object.
         * If the sprite object has not loaded when the click action is assigned by the user,
         * the eventQueue will be in charge of calling such action once the object does load.
         *
         * @param action = {Function} to be called when 'click' event is detected on object
        **/
		click:function(action) {
			requireID();
			if(!Lib.eventQueue[this.id]) Lib.eventQueue[this.id] = [];
			Lib.eventQueue[this.id].push(action);
			if(Lib.loaded && Lib.entities[this.id] || this.loaded) {
				Lib.events.addClickActionTo(this, action);
			}
		},
		freeze:function() {
			//this.stopAnimation();
		},
		getHeight:function() {
			var height = 0;

			if(!this.loaded) {
				throw 'Lib.getHeight error: Attempted to read value of resource object that has not yet loaded.';
			} else {
				height = this.spritesheet.scale ? this.spritesheet.height : this.spritesheet.size[1];
			}

			return height;
		},
		getSpriteWidth:function() {
			return this.spritesheet.src.width || this.settings.size[0];
		},
		getSpriteX:function() {
			return this.spritesheet.pos[0];
		},
		getSpriteY:function() {
			return this.spritesheet.pos[1];
		},
		getWidth:function() {
			var width = 0;

			if(!this.loaded) {
				throw 'Lib.getWidth error: Attempted to read value of resource object that has not yet loaded.';
			} else {
				width = this.spritesheet.scale ? this.spritesheet.width : this.spritesheet.size[0];
			}

			return width;
		},
		load:function(a) {
			requireID();
			if(!Lib.entityReadyEvents[Lib.id]) Lib.entityReadyEvents[Lib.id] = [];
			Lib.entityReadyEvents[Lib.id].push(a);
			if(Lib.loaded && Lib.entities[Lib.id]) a.call(Lib.entities[Lib.id]);
		},
		onclick:function(a) {
			this.click(a);
		},
		resumeAnimation:function() {
			this.spritesheet.runAnimation = true;
		},
		reverseAnimation:function(a) {
			var frames = [];
			if(a) {
				this.spritesheet.reverseAnimation = true;
				for(var i=this.spritesheet.frames.length-1;i>=0;i--) {
					frames.push(i);
				}
			} else {
				this.spritesheet.reverseAnimation = false;
				for(var i=0;i<this.spritesheet.frames.length;i++) {
					frames.push(i);
				}
			}
			this.spritesheet.frames = frames;
		},
		setFrames:function(a) {
			if(a instanceof Array) this.spritesheet.frames = a;
		},
		setFrequency:function(a) {
			this.spritesheet.frequency = a;
		},
		setSpriteX:function(a) {
			this.spritesheet.pos[0] = a;
		},
		setSpriteY:function(a) {
			this.spritesheet.pos[1] = a;
		},
		sprite:function() {
			throw "Lib.sprite error: An object with that id already exists.";
		},
		stopAnimation:function() {
			this.spritesheet.runAnimation = false;
		},
		unfreeze:function() {
			this.resumeAnimation();
		}
	},
	sharedEvents:{
		decreaseX:function(a) {
			if(a) this.x -= (this.speed * time.dt) * a;
			else this.x -= this.speed * time.dt;
		},
		decreaseY:function(a) {
			if(a) this.y -= (this.speed * time.dt) * a;
			else this.y -= this.speed * time.dt;
		},
		extend:function(a,b) {
			requireID();
			if(!Lib.extensions[Lib.id]) Lib.extensions[Lib.id] = {};
			Lib.extensions[Lib.id][a] = b;
			if(Lib.loaded && Lib.entities[Lib.id]) Lib.entities[Lib.id][a] = b,console.log('good');
			else console.log(Lib.loaded);
		},
		extendType:function(a,b) {
			if(this.settings.type == "sprite") Lib.spriteEvents[a] = b;
			else if(this.settings.type == "line") Lib.lineEvents[a] = b;
			else if(this.settings.type == "rect") Lib.rectEvents[a] = b;
		},
		getIndex:function() {
			return this.settings.index;
		},
		getLineWidth:function() {
			if(this.settings.type == "sprite") return 0;
			return this.settings.width;
		},
		getWidth:function() {
			return this.settings.size[0] || this.getLineWidth();
		},
		getX:function() {
			return this.x;
		},
		getY:function() {
			return this.y;
		},
		hide:function() {
			this.isHidden = true;
		},
		increaseX:function(a) {
			if(a) this.x += (this.speed * time.dt) * a;
			else this.x += this.speed * time.dt;
		},
		increaseY:function(a) {
			if(a) this.y += (this.speed * time.dt) * a;
			else this.y += this.speed * time.dt;
		},
		load:function(a) {
			a.call(this);
		},
		remove:function() {

		},
		show:function() {
			this.isHidden = false;
		},
		setSpeed:function(a) {
			this.speed = a;
		},
		setWidth:function(a) {
			if(this.settings.type == "line") this.settings.width = a;
			else if(this.settings.type == "sprite") this.spritesheet.size[0] = a;
			else this.settings.size[0] = a;
		},
		setX:function(a) {
			this.x = a;
		},
		setY:function(a) {
			this.y = a;
		},
		toggleHide:function() {
			if(this.isHidden) this.isHidden = false;
			else this.isHidden = true;
		},
	},
	lineEvents:{
		getHeight:function() {
			this.getLength();
		},
		getLength:function() {
			var val = 0;
			val = this.settings.toY - this.getY();
			return val || 0;
		},
		render:function(ctx) {
			ctx.lineWidth = this.settings.width;
			ctx.strokeStyle = this.settings.color;
			ctx.beginPath();
			ctx.moveTo(0,0);
			ctx.lineTo(this.settings.toX,this.settings.toY);
			ctx.stroke();
		}
	},
	rectEvents:{
		getFillColor:function() {
			return this.settings.fillColor || false;
		},
		getHeight:function() {
			return this.settings.size[1];
		},
		getWidth:function(){
			return this.settings.size[0];
		},
		setFillColor:function(a) {
			this.settings.fillColor = a;
		},
		render:function(ctx) {
			ctx.beginPath();
			ctx.lineWidth = this.settings.width;
			if(this.settings.color) ctx.strokeStyle = this.settings.color;
			if(this.settings.fillColor) ctx.fillStyle = this.settings.fillColor;
			ctx.rect(this.x,this.y,this.settings.size[0],this.settings.size[1]);
			if(this.settings.color) ctx.stroke();
			if(this.settings.fillColor) ctx.fill();
		}
	},
	events:{
		/**
	     * Adds wrapper function with condition so that passed function is called only
	     * when click a event happens within the coordinates of the object passed.
	     * Created wrapper function is then added to the canvasEvents.click[] array.
	     *
	     * @param object = {Lib Object}	object to apply onClick action to
	     * @param action = {Function}	written by user to execute on object click
	    **/
		addClickActionTo:function(object, action) {
			var self = object;

			//create wrapper function with coordinate condition
			Lib.canvasEvents.click.push(function(e) {
				var pageX = e.pageX - Lib.canvas.getBoundingClientRect().left;		// get position of current object with respect...
				var pageY = e.pageY - Lib.canvas.getBoundingClientRect().top;		// ...to the canvas's position on the page

				// if cursor is within the boundaries of our object on canvas click event,
				// call all of this object's functions assigned to its 'click' event
				if(
					(pageX + self.getOffsetX() >= self.getX() && pageX + self.getOffsetX() <= self.getX() + self.getWidth()) &&
						(pageY + self.getOffsetY() >= self.getY() && pageY + self.getOffsetY() <= self.getY() + self.getHeight())
				) {
					action.call(self, e);
				}
			});
		},
		addInputRule:function(a) {
			Lib.inputRules.push(a);
		},
		addObject:function(o,id) {
			if(!debug._indexCountInit && o.index) {
				if(o.index < -1) throw "Invalid index value. Must be at least -1.";
				else debug._indexCountInit = true;
			}
			if(id) Lib.entities[id] = o;
			if(debug._indexCountInit) {
				var objects = Lib.canvases[o._index].objects;
				var greatestIndex = -1;
				var greatestIndexIndex = -1;
				var leastIndex = -1;
				var leasrIndexIndex;

				for(var i=0;i<objects.length;i++){
					if(objects[i].index && leastIndex == -1) {
						leastIndexIndex = objects.indexOf(objects[i]);
						leastIndex = objects[i].index;
					}
					if(objects[i].index && objects[i].index >= greatestIndex) {
						greatestIndexIndex = objects.indexOf(objects[i]);
						greatestIndex = objects[i].index;
					}
				}
				if(o.index) {
					if(o.index >= greatestIndex) {
						Lib.canvases[o._index].objects.push(o);
					} else {
						if(o.index <= leastIndex) {
							Lib.canvases[o._index].objects.splice(leastIndexIndex,0,o);
						} else {
							var __idx = null;
							for(var i=leastIndexIndex;i<greatestIndexIndex;i++) {
								if(o.index > objects[i].index && __idx == null) {
									__idx = o.index;
								}
							}
							Lib.canvases[o._index].objects.splice(__idx+1,0,o);
						}
					}
				} else {
					Lib.canvases[o._index].objects.splice(leastIndexIndex,0,o);
				}
			} else {
				Lib.canvases[o._index].objects.push(o);
			}
			Lib.objects.push(o);
		},

		/**
		 * Adds action to canvasEvents.click[] Array to be called anytime
		 * the canvas is clicked.
		 *
		 * @param action = {Function} to be called when canvas is clicked
		**/
		click:function(action) {
			Lib.canvasEvents.click.push(action);
		},

		/**
		 * Emits user-created events stored in Lib.customevents{}
		 *
		 * @param eventName = {String}	to be called when canvas is clicked
		 * @param args	= {Array} 	of arguments that get passed as individual parameters
		 *								to functions called when eventName is emitted.
		**/
		emit:function(eventName, args) {
			// make sure 'args' is defined
			args = args || [];

			// if a single argument is passed, put it as single index in array
			if(!(args instanceof Array)) {
				args = [args];
			}

			// if eventName has not been used before, create it
			if(!Lib.customevents[eventName]) {
				Lib.customevents[eventName] = [];
			}

			// loop through each function in current user-emitted event
			// and call it, applying Lib as context and passing all args
			for(var i = 0; i < Lib.customevents[eventName].length; i++) {
				Lib.customevents[eventName][i].apply(Lib, args);
			}
		},
		on:function(e,fn) {
			if(!Lib.customevents[e]) Lib.customevents[e] = [];
			if(typeof fn == 'function') Lib.customevents[e].push(fn);
			else throw 'The second parameter for this method must be a function.';
		},
		getAnimationTime:function() {
			return time.dt;
		},
		getCanvas:function() {
			return Lib.canvas;
		},
		getContext:function() {
			return Lib.ctx;
		},
		getObject:function(a) {
			return Lib.entities[a];
		},
		getObjects:function() {
			return Lib.canvases[Lib.canvas._index].objects;
		},
		hasInput:function() {
			var bool = false,x=0,i;
			for(i in Lib.keys) {
				if(Lib.keys[i]) x++;
			}
			if(x) bool = true;
			return bool;
		},
		hasInputs:function(a) {
			var keys = 0,bool = false;
			if(a instanceof Array) {
				for(var i=0;i<a.length;i++) {
					if(Lib.keys[a[i]]) keys++;
				}
			} else {

			}
			if(keys == a.length) bool = true;
			return bool;
		},
		hasInputKey:function(a) {
			return Lib.keys[a];
		},

		/**
 		 * Checks whether a passed Lib.js object has been 'detached' from the rest of the objects
 		 * by looking to see if a _detachIndex property has been set.
		 *
 		 * @return = {Boolean} true if a _detachIndex has been assigned, false otherwise
		**/
		isObjectDetached:function(object) {
			return object._detachIndex ? true : false;
		},
		load:function(a) {
			Lib.readyEvents.push(a);
		},
		log:function(a) {
			if(debug.log) console.log(a);
		},
		logfps:function() {
			if(!debug._mainCalled) console.log("WARNING: To conserve resources, no frames will be logged until objects are added to the canvas.");
			debug.logfps = true;
		},
		pause:function() {
			debug._paused = true;
		},
		render:function(a) {
			Lib.externalRenderings.push(a);
		},
		reset:function() {

			Lib.canvas.getContext("2d").clearRect(0,0,Lib.canvas.width,Lib.canvas.height);

			time.dt = null;
			time.now = Date.now();
			time.last = Date.now();
			time.ellapsed = 0;

			debug._reset = true;
			debug._mainCalled = false;
			debug.logfps = false;
			debug.runAnimation = true;
			debug.useSingleCanvasMode = false;

			Lib.canvases = [];
			Lib.canvas = null;
			Lib.customevents = {};
			Lib.ctx = null;
			Lib.detached = [];
			Lib.entities = {};
			Lib.entityExists = {};
			Lib.entityReadyEvents = {};
			Lib.eventQueue = {};
			Lib.extensions = {};
			Lib.externalRenderings = [];
			Lib.id = null;
			Lib.keys = {};
			Lib.loaded = false;
			Lib.inputRules = [];
			Lib.objects = [];
			Lib.offset.x = 0;									// clear canvas offset in the vertical direction
			Lib.offset.y = 0;									// clear canvas offset in the horizontal direction
			Lib.pending = {length:0};							// remove functions that fire once their respective object is ready
			Lib.readyEvents = [];								// remove functions that execute on Lib.js 'ready' state
			Lib.resources = {};									// clear resources cache

			// reset every field back to an empty array
			for(var i in Lib.canvasEvents) {
				Lib.canvasEvents[i] = [];
			}
		},
		resume:function() {
			debug._paused = false;
			main();
		},
		resumeAnimation:function(canvas) {
			canvas = canvas || Lib.canvases[Lib.canvas._index];
			if(!canvas.runAnimation) { ////--
				canvas.runAnimation = true;
			
				var objects = canvas.objects;
				for(var i=0;i<objects.length;i++) {
					if(objects[i].settings.type == "sprite") objects[i].spritesheet.runAnimation = true;
				}
			}
		},
		stopAnimation:function(canvas) {
			canvas = canvas || Lib.canvases[Lib.canvas._index];
			if(canvas.runAnimation) {
				canvas.runAnimation = false;

				var objects = canvas.objects;
				for(var i=0;i<objects.length;i++) {
					if(objects[i].settings.type == "sprite") objects[i].spritesheet.runAnimation = false;
				}
			}
		},
		setSprite:function(data) {
			Lib.id = data.id;
			Lib.events.sprite(data);
		},
		setCanvas:function(a,b) {
			requireCanvas(a);
			if(Lib.canvases.length) {
				Lib.canvases[Lib.canvases.length-1].isCurrent = false;
				if(Lib.canvas) {
					for(var i=0;i<Lib.canvas.objects.length;i++) {
						Lib.canvases[Lib.canvases.length-1].objects[i] = Lib.canvas.objects[i];
					}
				}
			}
			Lib.canvas = a;
			Lib.canvas._index = Lib.canvases.length;
			Lib.canvas.runAnimation = true;
			Lib.canvases.push(a);
			Lib.canvases[Lib.canvases.length-1].objects = [];
			Lib.canvases[Lib.canvases.length-1].isCurrent = true;
			Lib.ctx = a.getContext("2d");
			Lib.canvas.tabIndex = "1";
			Lib.canvas.addEventListener('keydown',function(e) {
				e.preventDefault();
				Lib.keys[e.keyCode] = true;
			});
			Lib.canvas.addEventListener('keyup',function(e) {
				Lib.keys[e.keyCode] = false;
			});
			Lib.canvas.addEventListener('click',function(e) {
				Lib.canvasEvents.click.forEach(function(action) {
					action.call(Lib, e);
				});
			});
			var canvas = Lib.canvas;
			canvas.focus();
			Events.resize.push(function() {
				resizeCanvas(canvas);
			});
			resizeCanvas(canvas);
			function resizeCanvas(canvas) {
				if(b && typeof b == 'object' && b.resize) {
					canvas.style.width = "100%";
					canvas.style.height = "100%";
					canvas.width = window.innerWidth;
					canvas.height = window.innerHeight;
				}
			};
		},
		useSingleCanvasMode:function() {
			debug.useSingleCanvasMode = true;
		},
		line:function(a,b,c,d,e) {
			requireCanvas();
			var settings = {
				type:"line",
				x:0,
				y:0,
				color:"black",
				speed:16,
				toX:100,
				toY:100,
				width:1
			}
			if(typeof a == 'object') {
				for(var i in a) {
					settings[i] = a[i];
				}
			} else {
				settings.x = a || 0;
				settings.y = b || 0;
				settings.toX = c || a;
				settings.toY = d || b;
				settings.color = e || "black";
			}
			var object = {
				_index:Lib.canvases.length-1,
				x:settings.x,
				y:settings.y,
				id:Lib.id,
				speed:settings.speed,
				settings:settings,
				canvas:Lib.canvas,
				ctx:Lib.canvas.getContext("2d")
			};
			var methods = {};
			for(var i in Lib.sharedEvents) {
				methods[i] = Lib.sharedEvents[i];
			}
			for(var i in Lib.lineEvents) {
				methods[i] = Lib.lineEvents[i];
			}
			for(var i in methods) {
				if(!object[i]) object[i] = methods[i];
			}
			Lib.addObject(object,Lib.id);
			Lib.pending.length++;
			if(!debug._mainCalled) debug._mainCalled = true,main();
		},
		rect:function(a,b,c,d,e,f) {
			requireCanvas();
			var settings = {
				type:"rect",
				x:0,
				y:0,
				size:[200,100],
				fillColor:null,
				color:"black",
				speed:16,
				width:1
			}
			if(typeof a == 'object') {
				for(var i in a) {
					settings[i] = a[i];
				}
			} else {
				settings.x = a || 0;
				settings.y = b || 0;
				settings.size[0] = c || a;
				settings.size[1] = d || b;
				settings.color = e || null;
				settings.fillColor = f || null;
			}
			var object = {
				_index:Lib.canvases.length-1,
				x:settings.x,
				y:settings.y,
				id:Lib.id,
				speed:settings.speed,
				settings:settings,
				canvas:Lib.canvas,
				ctx:Lib.canvas.getContext("2d")
			};
			var methods = {};
			for(var i in Lib.sharedEvents) {
				methods[i] = Lib.sharedEvents[i];
			}
			for(var i in Lib.rectEvents) {
				methods[i] = Lib.rectEvents[i];
			}
			for(var i in methods) {
				if(!object[i]) object[i] = methods[i];
			}
			Lib.addObject(object,Lib.id);
			Lib.pending.length++;
			if(!debug._mainCalled) debug._mainCalled = true,main();
		},
		image:function(a,b,c) {
			var settings = {
				type:"image",
				id:null,
				src:null,
				size:null,
				speed:100,
				frequency:16,
				position:[0,0],
				direction:'horizontal',
				frames:[0],
				x:0,
				y:0
			};
			if(typeof a == 'object') {
				for(var i in a) {
					settings[i] = a[i];
				}
			} else {
				settings.src = a;
				settings.x = b;
				settings.y = c;
			}
			Lib.sprite(settings);
		},

		/**
 		 * Adds a sprite object [to the global entities array] to be rendered.
 		 * If the first @param is of type Object {}, the rest of the paramters are ignored
 		 * and the fields of the first @param object are assigned as settings to the sprite object
		 *
		 * Spite objects consist of clipping sections of a spritesheet image containing individual 'frames'
		 * and displaying such frames one at a time in the order specified by the user
		 *
 		 * @param source 		= {String}	path/to/image | {Object} dictionary with sprite properties
  		 * @param frameSize 	= {Array} 	[width, height] of each frame on the spritesheet
 		 * @param frequency 	= {Integer}	framerate of sprite animation
 		 * @param position 		= {Array} 	position on spreashseet to begin reading
 		 * @param orientation 	= {String}	('horizontal' | 'vertical') direction to read spreadsheet
 		 * @param frameSequence = {Array} 	of integers representing sequence and amount of frames to read
 		 *
 		 * @return self 		= {*Sprite}	returns pointer to current Lib.js Sprite object settings
		**/
		sprite:function(source, frameSize, frequency, position, orientation, frameSequence) {
			// require an id to be passed to the Lib function [Lib(REQUIRED_ID).sprite(...)] before initializing this method.
			// require a canvas to have been assigned to Lib.js before initializing this method.
			requireID();
			requireCanvas();

			// define default sprite settings
			var settings = {
				direction:'horizontal',							// defined by @param direction
				flip:false,										// flip sprite horizontally
				frames:null,									// defined by @param frameSequence
				frequency:16,									// defined by @param frequency
				id:null,										// id name to assign to object (*required as stated above)
				index:null,										// tabIndex of our object. Higher index places object on top of others
				loaded:false,									// indicates whether image resource has loaded for our object
				logfps:false,									// flag for toggling console log output of framerate rendering
				position:[0,0],									// defined by @param position
				scale:null,										// value >= 0.1 to scale image by
				size:null,										// defined by @param frameSize
				speed:100,										// translation speed of object accross canvas
				spritesheet:null,								// Sprite object containing sprite animation render data
				src:null,										// source of our spritesheet (*)
				renderings:[],									// array of user functions. Called every frame with object as context
				reverse:false,									// determines whether frameSequence array will be read in reverse
				rotate:0,										// rotate sprite x degrees
				type:'sprite',									// type of Lib.js object being created
				x:0,											// x position of object on game screen
				y:0												// y position of object on game screen
			};

			// determine if first @param is of type object
			if(typeof source == 'object') {
				for(var i in source) {
					settings[i] = source[i];					// assign values of Object first @param to default sprite settings
				}
			} else {
				// assign passed @params one by one to their respective default sprite settings
				settings.src = source;
				settings.size = frameSize;
				settings.frequency = frequency;
				settings.position = position;
				settings.direction = orientation;
				settings.frames = frameSequence;
			}

			// make sure a sprite source and size are passed as @parameters
			if((!settings.src || !settings.size) && settings.type == "sprite") throw "You must provide a sprite source and size.";

			// if an id was passed as a @param by the user, use that instead of existing (required) id
			if(settings.id) Lib.id = settings.id;

			// finish adding default sprite settings such as spritesheet 2D canvas context,
			// and image information.
			settings._index = Lib.canvases.length-1;			// index of current canvas being used (in array of canvases)
			settings.id = Lib.id;								// current global id context, assigned to our current object
			settings.settings = settings;						// circular pointer to settings to add support to old methods
			settings.canvas = Lib.canvas;						// pointer to our main canvas
			settings.ctx = Lib.canvas.getContext("2d");			// shortcut to our 2D canvas context for drawing to screen

			var methods = {};									// dictionary object containing shared methods and sprite methods

			// add every method in the sharedEvents: module to the methods dictionary
			for(var i in Lib.sharedEvents) {
				methods[i] = Lib.sharedEvents[i];
			}

			// add every method in the spriteEvents: module to the methods dictionary. If the method was
			// already added by the sharedEvents: module, overwrite it with the spriteEvents: module method
			for(var i in Lib.spriteEvents) {
				methods[i] = Lib.spriteEvents[i];
			}

			//add every method collected in the methods{} dictionary to the default sprite settings
			for(var i in methods) {
				if(!settings[i]) settings[i] = methods[i];
			}

			Lib.pending.length++;								// increase the length of our pending objects collection
			Lib.pending[Lib.id] = settings;						// store settings as key-value pair to global dictionary of
																// pending objects using id as key

			// assign the {Image} @return value of getImageFromURL() {Function} to settings.image
			settings.image = getImageFromURL(settings.src,function(image) {
				var self = settings;							// assign pointer to settings for readability. (self == settings)

				// make sure we have a frame size array defined
				// if one was not defined by user, set default
				// dimensions to those of our image.
				if(!self.size) {
					self.size = [];
					self.size[0] = image.width;
					self.size[1] = image.height;
				}

				// make sure we have a frame sequence to work with
				// if one was not defined by user, calculate default
				// sequence using frameSize and image dimensions
				if(!self.frames) {
					// initialize variable to hold total amount of frames we'll have
					var count = Math.floor(image.width / self.size[0]);
					
					self.frames = [];

					// push frame sequence in order (reverse | forward) defined by settings
					if(self.reverse) {
						for(var i = count - 1; i >= 0; i--) {
							self.frames.push(i);
						}
					} else {
						for(var i = 0; i < count; i++) {
							self.frames.push(i);
						}
					}
				}

				// This method supports default / static images. If user defined type is of 'image',
				// revert back to sprite. Method will work the same for both settings.
				if(self.type == 'image') {
					self.type = 'sprite';
				}

				// if a string value is passed for our object coordinates, translate
				// string to pre-defined values of 'center', 'right', 'left', 'top',
				// and 'bottom' indicating where to draw our image on the screen.
				if(self.x == 'center') {
					self.x = self.canvas.width / 2 - self.size[0] / 2;
				} else if(self.x == 'right') {
					// draw on the right of the screen by subtracting the width of an individual frame
					// from the total size of our canvas
					self.x = self.canvas.width - self.size[0];
				} else if(self.x == 'left' || !self.x || typeof self.x == 'string') {
					self.x = 0;
				}

				// do the same for our y coordinate
				if(self.y == 'center') {
					self.y = self.canvas.height / 2 - self.size[1] / 2;
				} else if(self.y == 'bottom') {
					// subtract the height of an individual frame from the canvas height
					self.y = self.canvas.height - self.size[1];
				} else if(self.y == 'top' || !self.y || typeof self.y == 'string') {
					self.y = 0;
				}

				// initialize our spritesheet object. Instantiate Sprite class with predefined settings
				self.spritesheet = new Sprite(self.src, self.size, self.frequency, self.position, self.direction, self.frames, self.canvas);
				
				// adjust oru spritesheet settings based on our default settings from above
				if(self.reverse) {
					self.spritesheet.reverseAnimation = true;	// force Sprite class to render frames in reverse order
				}

				if(self.scale) {
					self.spritesheet.scale = self.scale;
				}

				// add object to main library object array
				Lib.events.addObject(self, self.id);

				// Since our sprite object will not be recognized by the browser, we must add events such as
				// 'click', 'mouseover', etc... manually. We simulate these by listening to such methods with
				// the Canvas object, and mapping them to each of our objects. Below, we store user-defined actions
				// that are to take place when such events are detected against one of our objects.

				if(Lib.eventQueue[self.id]) {
					// Check to see if any event actions have
					// been assigned for current object id
					var events = Lib.eventQueue[self.id];		// fetch all event actions for current object as array of functions
					Lib.entities[self.id].hasEvent = true;		// our object has an event. Set flag accordingly.

					// loop through all queued events, assign them a context of our current
					// object, and pass them to our addClickActionTo function
					for(var i = 0; i < events.length; i++) {
						Lib.events.addClickActionTo(self, events[i]);
					}
				}

				self.loaded = true;								// Let library know this object is ready to use. Needed if object's
																// resource was cached, as it will load its functions from
																// Lib.eventQueue before they are populated, since there is no
																// 'lag' time between waiting for image to load, and rest of code

				// if there are any user-defined methods for this object's id,
				// add them to the object.
				if(Lib.extensions[self.id]) {
					for(var i in Lib.extensions[self.id]) {
						self[i] = Lib.extensions[self.id][i];
					}
				}

				// call any functions that have been assigned to run as soon as
				// the sprite image has been loaded and this object is ready
				if(Lib.entityReadyEvents[self.id]) {
					for(var i=0;i<Lib.entityReadyEvents[self.id].length;i++) {
						Lib.entityReadyEvents[self.id][i].call(self);
					}
				}

				// If all pending objects have been loaded, and Lib.js has not been previously
				// initialized, initialize it by setting Lib.loaded to true
				if(!Lib.loaded) {
					if(Lib.objects.length == Lib.pending.length) {
						Lib.loaded = true;						// tells library all pending objects have loaded

						// call all functions assigned to run as soon as at least
						// one object has loaded using the "Lib.load..." method.
						for(var i=0;i<Lib.readyEvents.length;i++) {
							Lib.readyEvents[i].call(Lib);
						}
					}
				}

				// if the main animation loop hasn't been called yet,
				// call it, since at least one object has been added.
				if(!debug._mainCalled) {
					debug._mainCalled = true;					// tells library main function has been called

					// begin animation loop
					main();
				}
			});

			return settings;
		}
	}
};

function requireCanvas(a) {
	if(!a) {
		if(!Lib.canvas) throw "Error: Canvas element not specified.";
	} else {
		if(Lib.canvas) {
			if(a.nodeName != 'CANVAS' && Lib.canvas.nodeName != 'CANVAS') throw "Element specified must be a canvas element.";
		} else {
			if(a.nodeName != 'CANVAS') throw "Element specified must be a canvas element.";
		}
	}
}

function requireID() {
	if(!Lib.id) throw "You must provide an object id.";
}

/**
 * Checks to see if an image has been previously used / loaded before by looking
 * for its path in the global resource cache. If the image has not previously been,
 * loaded, it is loaded and added to the cache
 *
 * @param url		= {String}	 path/to/resource
 * @param callback	= {Function} function to be called after resource becomes available
 *
 * @return = {Image} pointer to cached image
**/
function getImageFromURL(url, callback) {
	// checks resources cache for resource
	if(Lib.resources[url]) {
		// if resource is found in cache, call callback,
		// make context image, and pass image object as @param 
		callback.call(Lib.resources[url], Lib.resources[url]);
	} else {
		Lib.resources[url] = new Image();						// create new Image object and store it in cache
		Lib.resources[url].src = url;							// assign image source the passed path/to/resource

		// wait until image loads before calling callback
		Lib.resources[url].addEventListener('load', function() {
			//call callback with context of cached image and pass it as first @param
			callback.call(this, this);
		});
	}

	return Lib.resources[url];
}

function canSlowWrite() {
	var bool = false;
	if(!(time.now % 10) && !(time.now % 6) && !(time.now % 8)) bool = true;
	return bool;
}

function main() {
	time.now = Date.now();
	time.dt = (time.now - time.last) / 1000;
	time.last = time.now;
	parseInput(time.dt);
	update(time.dt);
	render();
	if(debug.logfps && canSlowWrite()) console.log("Running at "+Math.round(1000 / (time.dt*1000))+" FPS");
	if(!debug._reset && !debug._paused) frame(main);
}

function parseInput(dt) {
	if(Lib.inputRules.length) {
		for(var i=0;i<Lib.inputRules.length;i++) {
			Lib.inputRules[i].call(Lib)
		}
	}
}

function update(dt) {
	if((debug.useSingleCanvasMode || Lib.canvases.length == 1) && Lib.canvas) Lib.ctx.clearRect(0,0,Lib.canvas.width,Lib.canvas.height);
	else if(Lib.canvases.length > 1) {
		for(var i=0;i<Lib.canvases.length;i++) {
			var canvas = Lib.canvases[i];
			var ctx = canvas.getContext("2d");
			ctx.clearRect(0,0,canvas.width,canvas.height)
		}
	}
	for(var i=0;i<Lib.objects.length;i++) {
		if(Lib.objects[i].settings.type == "sprite") Lib.objects[i].spritesheet.update(dt);
	}
	time.ellapsed++;
}

function render() {
	var ctx;													// current 2D canvas context being looped through

	for(var i=0;i<Lib.canvases.length;i++) {
		ctx = Lib.canvases[i].getContext("2d");					// set the local 2D context to that of the current canvas in loop 
		for(var x=0;x<Lib.canvases[i].objects.length;x++) {
			var xpos = Lib.canvases[i].objects[x].x;			// amount of pixels in the x direction to translate canvas by
			var ypos = Lib.canvases[i].objects[x].y;			// amount of pixels in the y direction to translate canvas by

			// checks to see if any objects have been detached.
			if(Lib.detached.length) {
				// checks that current object has not been detached
				// by checking for the existence of a ._detachIndex.
				if(!Lib.canvases[i].objects[x]._detachIndex) {
					xpos -= Lib.offset.x;						// decrease xpos by current object's horizontal offset from screen
					ypos -= Lib.offset.y;						// decrease ypos by current object's vertical offset from screen
				}
			}
			ctx.save();
			ctx.translate(xpos,ypos);
			if(Lib.canvases[i].objects[x].settings.type == "sprite") { // if current object at index x is sprite
				if(!Lib.canvases[i].objects[x].isHidden) {
					Lib.canvases[i].objects[x].spritesheet.render(ctx);
					Lib.canvases[i].objects[x].renderings.forEach(function(rendering) {
						rendering.call(Lib.canvases[i].objects[x],ctx,xpos,ypos);
					});
				}
			} else if(!Lib.canvases[i].objects[x].isHidden) Lib.canvases[i].objects[x].render(ctx);
			ctx.restore();
		}
		Lib.externalRenderings.forEach(function(rendering) {
			rendering.call(Lib,ctx);
		});
	}
}

function lib(a) {
	debug._reset = false;
	var rtrn = Lib.events;
	Lib.id = null;
	if(a && typeof a == 'object') Lib.events.setCanvas(a);
	else if(typeof a == 'string') {
		Lib.id = a;
		if(Lib.entityExists[a]) {
			if(Lib.entities[a]) rtrn = Lib.entities[a];
			else {
				if(Lib.pending[a]) rtrn = Lib.pending[a];
				else rtrn = Lib.events;
			}
		} else rtrn = Lib.events;
		if(!Lib.entityExists[Lib.id]) Lib.entityExists[Lib.id] = true;
	}
	return rtrn;
}

if(!debug._eventsInit) {
	debug._eventsInit = true;
	for(var i in Events) {
		window.addEventListener(i,function() {
			for(var x=0;x<Events[i].length;x++) {
				if(typeof Events[i][x] == 'function') Events[i][x].call();

			}
		});
	}
}
for(var x in Lib.events) {
	lib[x] = Lib.events[x].bind(Lib);
}
window.Lib = lib;
})(window,document);