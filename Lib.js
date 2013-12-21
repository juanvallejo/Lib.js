(function() {
var frame = (function() {
	return window.requestAnimationFrame || 
		   window.mozRequestAnimationFrame ||
		   window.webkitRequestAnimationFrame ||
		   function t(a) {
				setTimeout(a,1000/60);
			};
})(),time = {
	dt:null,
	now:Date.now(),
	last:Date.now(),
	ellapsed:0
},debug = {
	_reset:false,
	_mainCalled:false,
	_paused:false,
	logfps:false,
	runAnimation:true,
	useSingleCanvasMode:false
};
function Sprite(url,size,speed,pos,dir,frames,canvas) {
	this._index = 0;
	this.canvas = canvas;
	this.dir = dir || 'horizontal';
	this.frames = frames;	
	this.pos = pos || [0,0];
	this.size = size;
	this.frequency = speed || 0;
	this.url = url;
	this.runAnimation = true;
	this.reverseAnimation = false;
};
Sprite.prototype.update = function(dt) {
	this._index += this.frequency * dt;
};
Sprite.prototype.render = function(ctx) {
	var max = this.frames.length;
	var idx = Math.floor(this._index);
	var frame = this.frames[idx % max];
	var x = this.pos[0],y = this.pos[1];
	if(!this.runAnimation) {
		if(this.reverseAnimation) frame = this.frames.length-1;
		else frame = 0;
	}
	if(this.dir == 'horizontal') x += this.size[0]*frame;
	else y += this.size[1]*frame;
	ctx.drawImage(Lib.resources[this.url],x,y,this.size[0],this.size[1],0,0,this.size[0],this.size[1]);
};
var Lib = {
	canvas:null,
	canvases:[],
	ctx:null,
	entities:{},
	entityExists:{},
	entityReadyEvents:{},
	eventQueue:{},
	extensions:{},
	id:null,
	keys:{},
	loaded:false,
	inputRules:[],
	objects:[],
	pending:{length:0},
	readyEvents:[],
	resources:{},
	events:{
		click:function(a) {
			requireID();
			if(!Lib.eventQueue[Lib.id]) Lib.eventQueue[Lib.id] = [];
			Lib.eventQueue[Lib.id].push(a);
			if(Lib.loaded && Lib.entities[Lib.id]) Lib.sharedEvents.click.call(this,a);
		},
		freeze:function() {
			//this.stopAnimation();
		},
		getHeight:function() {
			return this.sprite.size[1];
		},
		getSpriteWidth:function() {
			return this.sprite.src.width || this.settings.size[0];
		},
		getSpriteX:function() {
			return this.sprite.pos[0];
		},
		getSpriteY:function() {
			return this.sprite.pos[1];
		},
		getWidth:function() {
			return this.sprite.size[0];
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
			this.sprite.runAnimation = true;
		},
		reverseAnimation:function(a) {
			var frames = [];
			if(a) {
				this.sprite.reverseAnimation = true;
				for(var i=this.sprite.frames.length-1;i>=0;i--) {
					frames.push(i);
				}
			} else {
				this.sprite.reverseAnimation = false;
				for(var i=0;i<this.sprite.frames.length;i++) {
					frames.push(i);
				}
			}
			this.sprite.frames = frames;
		},
		setFrames:function(a) {
			if(a instanceof Array) this.sprite.frames = a;
		},
		setFrequency:function(a) {
			this.sprite.frequency = a;
		},
		setSpriteX:function(a) {
			this.sprite.pos[0] = a;
		},
		setSpriteY:function(a) {
			this.sprite.pos[1] = a;
		},
		sprite:function() {
			throw "Error: An object with that id already exists.";
		},
		stopAnimation:function() {
			this.sprite.runAnimation = false;
		},
		unfreeze:function() {
			this.resumeAnimation();
		}
	},
	sharedEvents:{
		click:function(a) {
			var self = this;
			this.canvas.addEventListener('click',function(e) {
				var pageX = e.pageX - this.getBoundingClientRect().left;
				var pageY = e.pageY - this.getBoundingClientRect().top;
				if((pageX >= self.x && pageX <= self.x + self.settings.size[0]) && (pageY >= self.y && pageY <= self.y + self.settings.size[1])) {
					a.call(self);
				}
			});
		},
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
			if(Lib.loaded && Lib.entities[Lib.id]) Lib.entities[Lib.id][a] = b;
		},
		extendType:function(a,b) {
			if(this.settings.type == "sprite") Lib.events[a] = b;
			else if(this.settings.type == "line") Lib.lineEvents[a] = b;
			else if(this.settings.type == "rect") Lib.rectEvents[a] = b;
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
			else if(this.settings.type == "sprite") this.sprite.size[0] = a;
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
	addInputRule:function(a) {
		Lib.inputRules.push(a);
	},
	addObject:function(o,id) {
		if(id) Lib.entities[id] = o;
		Lib.objects.push(o);
		Lib.canvases[o._index].objects.push(o);
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
				if(this.keys[a[i]]) keys++;
			}
		} else {

		}
		if(keys == a.length) bool = true;
		return bool;
	},
	hasInputKey:function(a) {
		return Lib.keys[a];
	},
	load:function(a) {
		Lib.readyEvents.push(a);
	},
	logfps:function() {
		if(!debug._mainCalled) console.log("WARNING: To conserve resources, no frames will be logged until objects are added to the canvas.");
		debug.logfps = true;
	},
	pause:function() {
		debug._paused = true;
	},
	reset:function() {
		debug._reset = true;
		this.canvas.getContext("2d").clearRect(0,0,this.canvas.width,this.canvas.height);
		time.dt = null;
		time.now = Date.now();
		time.last = Date.now();
		time.ellapsed = 0;
		debug._mainCalled = false;
		debug.logfps = false;
		debug.runAnimation = true;
		debug.useSingleCanvasMode = false;
		this.canvases = [];
		this.canvas = null;
		this.ctx = null;
		this.entities = {};
		this.entityExists = {};
		this.entityReadyEvents = {};
		this.eventQueue = {};
		this.extensions = {};
		this.id = null;
		this.keys = {};
		this.loaded = false;
		this.inputRules = [];
		this.objects = [];
		this.pending = {length:0};
		this.readyEvents = [];
		this.resources = {};
	},
	resume:function() {
		debug._paused = false;
		main();
	},
	resumeAnimation:function(c) {
		var canvas = c || Lib.canvases[Lib.canvas._index];
		if(!canvas.runAnimation) { ////--
			canvas.runAnimation = true;
		//	for(var i=0;i<Lib.objects.length;i++) {
		//		if(Lib.objects[i].settings.type == "sprite") Lib.objects[i].sprite.runAnimation = true;
		//	}
			var objects = canvas.objects;
			for(var i=0;i<objects.length;i++) {
				if(objects[i].settings.type == "sprite") objects[i].sprite.runAnimation = true;
			}
		}
	},
	stopAnimation:function(c) {
		var canvas = c || Lib.canvases[Lib.canvas._index];
		if(canvas.runAnimation) {
			canvas.runAnimation = false;
		//	for(var i=0;i<Lib.objects.length;i++) {
		//		if(Lib.objects[i].settings.type == "sprite") Lib.objects[i].sprite.runAnimation = false;
		//	}
			var objects = canvas.objects;
			for(var i=0;i<objects.length;i++) {
				if(objects[i].settings.type == "sprite") objects[i].sprite.runAnimation = false;
			}
		}
	},
	setCanvas:function(a) {
		requireCanvas(a);
		if(this.canvases.length) {
			this.canvases[this.canvases.length-1].isCurrent = false;
			if(this.canvas) {
				for(var i=0;i<this.canvas.objects.length;i++) {
					this.canvases[this.canvases.length-1].objects[i] = this.canvas.objects[i];
				}
			}
		}
		this.canvas = a;
		this.canvas._index = this.canvases.length;
		this.canvas.runAnimation = true;
		this.canvases.push(a);
		this.canvases[this.canvases.length-1].objects = [];
		this.canvases[this.canvases.length-1].isCurrent = true;
		this.ctx = a.getContext("2d");
		this.canvas.tabIndex = "1";
		this.canvas.addEventListener('keydown',function(e) {
			e.preventDefault();
			Lib.keys[e.keyCode] = true;
		});
		this.canvas.addEventListener('keyup',function(e) {
			Lib.keys[e.keyCode] = false;
		});
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
		this.sprite(settings);
	},
	sprite:function(a,b,c,d,e,f) {
		requireCanvas();
		var settings = {
			type:"sprite",
			id:null,
			src:null,
			size:null,
			speed:100,
			frequency:16,
			position:[0,0],
			direction:'horizontal',
			frames:null,
			reverse:false,
			logfps:false,
			x:0,
			y:0
		};
		if(typeof a == 'object') {
			for(var i in a) {
				settings[i] = a[i];
			}
		} else {
			settings.src = a;
			settings.size = b;
			settings.frequency = c;
			settings.position = d;
			settings.direction = e;
			settings.frames = f;
		}
		if((!settings.src || !settings.size) && settings.type == "sprite") throw "You must provide a sprite source and size.";
		if(settings.id) Lib.id = settings.id;
		var pendingObject = {
			_index:Lib.canvases.length-1,
			id:Lib.id,
			x:settings.x,
			y:settings.y,
			speed:settings.speed,
			settings:settings,
			image:new Image(),
			canvas:Lib.canvas,
			ctx:Lib.canvas.getContext("2d"),
			sprite:null,
		};
		var methods = {};
		for(var i in Lib.sharedEvents) {
			methods[i] = Lib.sharedEvents[i];
		}
		for(var i in Lib.events) {
			methods[i] = Lib.events[i];
		}
		for(var i in methods) {
			if(!pendingObject[i]) pendingObject[i] = methods[i];
		}
		Lib.pending.length++;
		Lib.pending[Lib.id] = pendingObject;
		Lib.pending[Lib.id].image.src = settings.src;
		Lib.pending[Lib.id].image.id = Lib.id;
		Lib.pending[Lib.id].image.addEventListener('load',function() {
			var self = Lib.pending[this.id];
			if(!self.settings.frames) {
				self.settings.frames = [];
				var count = Math.floor(this.width / self.settings.size[0]);
				if(self.settings.reverse) {
					for(var i = count-1;i >= 0;i--) {
						self.settings.frames.push(i);
					}
				} else {
					for(var i=0;i<count;i++) {
						self.settings.frames.push(i);
					}
				}
			}
			if(!self.settings.size) {
				self.settings.size = [];
				self.settings.size[0] = this.width;
				self.settings.size[1] = this.height;
			}
			if(self.settings.type == "image") self.settings.type = "sprite";
			if(self.settings.x == 'center') self.settings.x = self.canvas.width / 2 - self.settings.size[0] / 2;
			else if(self.settings.x == 'right') self.settings.x = self.canvas.width - self.settings.size[0];
			else if(self.settings.x == 'left' || !self.settings.x || typeof self.settings.x == 'string') self.settings.x = 0;
			if(self.settings.y == 'center') self.settings.y = self.canvas.height / 2 - self.settings.size[1] / 2;
			else if(self.settings.y == 'bottom') self.settings.y = self.canvas.height - self.settings.size[1];
			else if(self.settings.y == 'top' || !self.settings.y || typeof self.settings.y == 'string') self.settings.y = 0;
			self.x = self.settings.x;
			self.y = self.settings.y;
			self.sprite = new Sprite(self.settings.src,self.settings.size,self.settings.frequency,self.settings.position,self.settings.direction,self.settings.frames,self.canvas);
			if(self.settings.reverse) self.sprite.reverseAnimation = true;
			Lib.addObject(self,self.id);
			Lib.resources[self.settings.src] = this;
			if(Lib.eventQueue[self.id]) {
				var evts = Lib.eventQueue[self.id];
				Lib.entities[self.id].hasEvent = true;
				self.canvas.addEventListener("click",function(e) {
					var pageX = e.pageX - this.getBoundingClientRect().left;
					var pageY = e.pageY - this.getBoundingClientRect().top;
					if((pageX >= self.x && pageX <= self.x + self.settings.size[0]) && (pageY >= self.y && pageY <= self.y + self.settings.size[1])) {
						for(var i=0;i<evts.length;i++) {
							evts[i].call(self,e);
						}
					}
				});
			}
			if(Lib.extensions[self.id]) {
				for(var i in Lib.extensions[self.id]) {
					self[i] = Lib.extensions[self.id][i];
				}
			}
			if(Lib.entityReadyEvents[self.id]) {
				for(var i=0;i<Lib.entityReadyEvents[self.id].length;i++) {
					Lib.entityReadyEvents[self.id][i].call(self);
				}
			}
			if(!Lib.loaded) {
				if(Lib.objects.length == Lib.pending.length) {
					for(var i=0;i<Lib.readyEvents.length;i++) {
						Lib.loaded = true;
						Lib.readyEvents[i].call(Lib);
					}
				}
			}
			if(!debug._mainCalled) debug._mainCalled = true,main();
		});
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
};
function requireID() {
	if(!Lib.id) throw "You must provide an object id.";
};
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
};
function parseInput(dt) {
	if(Lib.inputRules.length) {
		for(var i=0;i<Lib.inputRules.length;i++) {
			Lib.inputRules[i].call(Lib)
		}
	}
};
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
		if(Lib.objects[i].settings.type == "sprite") Lib.objects[i].sprite.update(dt);
	}
	time.ellapsed++;
};
function render() {
	var ctx;
/*	for(var i=0;i<Lib.objects.length;i++) {
		ctx = Lib.objects[i].ctx;
		ctx.save();
		ctx.translate(Lib.objects[i].x,Lib.objects[i].y);
		if(Lib.objects[i].settings.type == "sprite") {
			if(!Lib.objects[i].isHidden) Lib.objects[i].sprite.render(ctx);
		} else if(!Lib.objects[i].isHidden) Lib.objects[i].render(ctx);
		ctx.restore();
	}*/
	for(var i=0;i<Lib.canvases.length;i++) {
		ctx = Lib.canvases[i].getContext("2d");
		for(var x=0;x<Lib.canvases[i].objects.length;x++) {
			ctx.save();
			ctx.translate(Lib.canvases[i].objects[x].x,Lib.canvases[i].objects[x].y);
			if(Lib.canvases[i].objects[x].settings.type == "sprite") {
				if(!Lib.canvases[i].objects[x].isHidden) Lib.canvases[i].objects[x].sprite.render(ctx);
			} else if(!Lib.canvases[i].objects[x].isHidden) Lib.canvases[i].objects[x].render(ctx);
			ctx.restore();
		}
	}
};
function lib(a) {
	debug._reset = false;
	var rtrn = Lib;
	Lib.id = null;
	if(a && typeof a == 'object') Lib.setCanvas(a);
	else if(typeof a == 'string') {
		Lib.id = a;
		if(Lib.entityExists[a]) {
			if(Lib.entities[a]) rtrn = Lib.entities[a];
			else {
				if(Lib.pending[a]) rtrn = Lib.pending[a];
				else rtrn = Lib;
			}
		} else rtrn = Lib;
		if(!Lib.entityExists[Lib.id]) Lib.entityExists[Lib.id] = true;
	}
	return rtrn;
}; 
window.Lib = function(a) {
	return lib(a);
};
})(window,document);