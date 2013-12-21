var Site = {
	canvasFocused:false,
	loaded:false,
	getDemoSyntax:function() {
		var html;
		html = "<pre>Lib().setCanvas(MY_CANVAS_ELEMENT);<br />"+
		"Lib().sprite('sprite_image.png',"+
		"[50,100]);<br />"+
		"</pre><br />"+
		"Lib.js provides extemely simple syntax to accomplish complex animation tasks.<br />"+
		"<br />It is useful for anything from simulating GIF loaders, to creating entire games.<br />"+
		"<br />Lib.js allows complete control over every frame of an object's animation, including frame order at any given time.";
		return html;
	},
	manageMenuLabels:function() {
		var arr = document.getElementById("menu").children[0].children;
		var li = [];
		for(var i=0;i<arr.length;i++) {
			li[i] = arr[i];
		}
		li.push(document.getElementById("contact").children[0].children[0]);
		li[0].style.backgroundPosition = "6px 6px";
		li[1].style.backgroundPosition = "-39px 6px";
		li[2].style.backgroundPosition = "-125px 5px";
		li[3].style.backgroundPosition = "-80px 3px";
		for(var i=0;i<li.length;i++) {
			li[i].addEventListener('mouseover',function() {
				if(!this.hasLabel) {
					this.hasLabel = true;
					this.label = document.createElement("div");
					this.label.className = "label";
					this.appendChild(this.label);
					this.label.style.bottom = (-(this.label.clientHeight))+"px";
				}
				this.label.style.left = (this.clientWidth / 2 - this.label.clientWidth / 2)+"px";
				this.label.style.opacity = "0.7";
				this.label.innerHTML = this.dataset.label || this.getAttribute('data-label');
				this.label.style.bottom = (-(this.label.clientHeight))+"px";
			});
			li[i].addEventListener('mouseout',function() {
				this.label.style.opacity = "0.0";
				this.label.innerHTML = "";
			});
			li[i].addEventListener('click',function() {
				var link = this.children[0].innerHTML;
				if(link == "contact") {
					window.location.href = "mailto:juuanv@gmail.com";
				} else if(link == "Thanks For Your Support!") {
					//Thanks for supporting Lib.js! Have an imaginary internet brownie!
				} else window.location.href = link+".html";
			});
		}
		document.getElementById("brand").addEventListener('click',function() {
			window.location.href = "index.html";
		});
	},
	manageCompatibilityIcons:function() {
		var ul = document.getElementById("Compatibility");
		if(ul) {
			var li = ul.children;
			if(li.length) {
				var width = li[0].parentNode.clientWidth;
				for(var i=0;i<li.length;i++) {
					var clientWidth = li[i].clientWidth;
					var margin = li[i].clientWidth / (li.length-1);
					li[i].style.margin = "0"+(margin)+"px 0"+(margin)+"px";
					if(i < 1) li[i].style.marginLeft = ((width-(clientWidth*li.length+((margin*2)*(li.length-1))))/2)+"px";
					li[i].style.backgroundPosition = (-i*clientWidth)+"px -38px";
					li[i].addEventListener('mouseover',function() {
						if(!this.hasLabel) {
							this.hasLabel = true;
							this.label = document.createElement("div");
							this.label.className = "label";
							this.label.style.fontSize = "1.1em";
							this.appendChild(this.label);
							this.label.style.bottom = (-(this.label.clientHeight))+"px";
						}
						this.label.style.left = (this.clientWidth / 2 - this.label.clientWidth / 2)+"px";
						this.label.style.opacity = "0.7";
						this.label.innerHTML = this.dataset.label || this.getAttribute('data-label');
						this.label.style.bottom = (-(this.label.clientHeight))+"px";
					});
					li[i].addEventListener('mouseout',function() {
						this.label.style.opacity = "0.0";
						this.label.innerHTML = "";
					});
				}
			}
		}
	},
	manageSidebar:function() {
		var menu = document.getElementById("sidebar");
		if(menu) {
			var li = menu.children[0].children;
			for(var i=0;i<li.length;i++) {
				li[i].addEventListener('click',function() {
					var self = this;
					var offset = $('#'+self.innerHTML).offset();
					if(offset) $('html,body').animate({scrollTop:offset.top},1000);
					window.location.hash = self.innerHTML;
				});
			}
		}
	},
	manageNotes:function() {
		var notes = document.getElementsByClassName("note");
		if(window.innerWidth < 1344) {
			if(window.innerWidth > 700) {

			} else {
				for(var i=0;i<notes.length;i++) {
					notes[i].style.cssFloat = "none";
					notes[i].style.margin = "70px auto 0 auto";
				}
			}
		} else {
			for(var i=0;i<notes.length;i++) {
				notes[i].style.margin = "70px 0 0 80px";
				notes[i].style.cssFloat = "left";
			}
		}
	},
	resizeDocContent:function() {
		var sidebar = document.getElementById("sidebar");
		var docContent = document.getElementById("doc-content");
		if(docContent && sidebar) {
			docContent.style.width = (docContent.parentNode.offsetWidth - sidebar.offsetWidth - 31)+"px";
		}
	},
	parseCodeSamples:function(a) {
		var doc = typeof a == 'string' ? document.getElementById(a) : a;
		if(doc) {
			var pre = doc.getElementsByTagName("pre");
			for(var i=0;i<pre.length;i++) {
				var word = pre[i].innerHTML.split("\n");
				for(var x=0;x<word.length;x++) {
					if(word[x].match(/\/\//gi)) {
						var w = word[x].split("//");
						var temp = parseString(w[0]);
						var comm = color("//"+w[1],"grey");
						word[x] = temp+comm;
					} else {
						word[x] = parseString(word[x]);
					}
				}
				pre[i].innerHTML = word.join("\n").replace(/\t/gi,'').replace(/  /gi,"\t");
			}
		}
		function parseString(a) {
			var word = a.replace(/\=/gi,"&#61").replace(/\+/gi,"&#43");
			if(word.match(/\&lt\;\!\-\-/gi)) {
				var str = word.replace(/(\&lt\;\!\-\-(.*)\-\-\&gt\;)/gi,color("$1","grey"));
				word = str;
			} else {
				if(word.match(/([^&#0-9][0-9]+)/gi)) {
					var str = word.replace(/([0-9]+)/gi,color("$1","rgb(165,87,190)"));
					word = str;
				}
				if(word.match(/(&#61|&#43)/gi)) {
					var str = word.replace(/(&#61|&#43)/gi,color("$1","rgb(247,121,145)"));
					word = str;
				}
				if(word.match(/(\&lt\;|&lt;\/)([a-z]+)\&gt\;/gi)) {
					var str = word.replace(/(\&lt\;|\&lt\;\/)([a-z]+)(\&gt\;)/gi,"$1"+color("$2","rgb(247,121,145)")+"$3");
					str = str.replace(/(\&lt\;)([a-z]+)(\ )/gi,"$1"+color("$2","rgb(247,121,145)")+"$3");
					word = str;
				} 
				if(word.match(/(if)(?=\()/gi)) {
					var str = word.replace(/(if)(?=\()/gi,color("$1","rgb(247,121,145)"));
					word = str;
				}
				if(word.match(/(else)/gi)) {
					var str = word.replace(/(else)/gi,color("$1","rgb(247,121,145)"));
					word = str;
				}
				if(word.match(/(&amp;&amp;)/gi)) {
					var str = word.replace(/(&amp;&amp;)/gi,color("$1","rgb(247,121,145)"));
					word = str;
				}
				if(word.match(/(\|\|)/gi)) {
					var str = word.replace(/(\|\|)/gi,color("$1","rgb(247,121,145)"));
					word = str;
				}
				if(word.match(/(return)(?=\ )/gi)) {
					var str = word.replace(/(return)(?=\ )/gi,color("$1","rgb(247,121,145)"));
					word = str;
				}
				if(word.match(/(var)(?=\ )/gi)) {
					var str = word.replace(/(var)(?=\ )/gi,color("$1","rgb(121,208,247)"));
					word = str;
				}
				if(word.match(/(function\(\))/gi)) {
					var str = word.replace(/(function)(?=\(\))/gi,color("$1","rgb(121,208,247)"));
					word = str;
				}
				if(word.match(/(window\.)/gi)) {
					var str = word.replace(/(window)(?=\.)/gi,"<i>"+color("$1","rgb(121,208,247)")+"</i>");
					word = str;
				}
				if(word.match(/(this)(?=[\.\;])/gi)) {
					var str = word.replace(/(this)(?=[\.\;])/gi,color("$1","rgb(121,208,247)"));
					word = str;
				}
				if(word.match(/(.log)(?=\()/gi)) {
					var str = word.replace(/(log)(?=\()/gi,color("$1","rgb(121,208,247)"));
					word = str;
				}
				if(word.match(/(null|true|false)/gi)) {
					var str = word.replace(/(null|true|false)/gi,color("$1","rgb(165,87,190)"));
					word = str;
				}
				if(word.match(/((\"|\')[a-z\/\_\ \.\-]+(\"|\'))/gi)) {
					var str = word.replace(/((\"|\')+[a-z\/\_\ \.\-]+(\"|\'))/gi,color("$1","rgb(247,223,121)"));
					word = str;
				}
			}
			return word;
		}
		function color(a,b) {
			return "<span style='color:"+b+";'>"+a+"</span>";
		}
	}
};

var objects = [];
objects.push(document.createElement("div"));
objects.push(document.createElement("div"));
objects.push(document.createElement("canvas"));
objects[0].id = "syntax";
objects[0].className = "note";
objects[0].innerHTML = Site.getDemoSyntax();
objects[1].id = "preview";
objects[1].className = "note note-back";
objects[2].appendTo = objects[1];
objects[2].addEventListener('focus',function() {
	Site.canvasFocused = true;
});
objects[2].addEventListener('blur',function() {
	Site.canvasFocused = false;
});

window.addEventListener('load',function() {
	Site.loaded = true;
	Site.manageMenuLabels();
	var wrapper = document.getElementById("note-wrapper");
	if(wrapper) {
		for(var i=0;i<objects.length;i++) {
			if(!objects[i].appendTo) wrapper.appendChild(objects[i]);
			else objects[i].appendTo.appendChild(objects[i]);
		}
		objects[2].width = objects[2].appendTo.clientWidth;
		objects[2].height = objects[2].appendTo.clientHeight;
		Site.manageNotes();
	}
	Site.resizeDocContent();
	Site.parseCodeSamples("doc-content");
	Site.parseCodeSamples("demo-wrapper");
	Site.parseCodeSamples(objects[0]);
	Site.manageCompatibilityIcons();
	Site.manageSidebar();
});
window.addEventListener('resize',function() {
	if(Site.loaded) {
		Site.manageNotes();
		Site.resizeDocContent();
	}
});

var MY_CANVAS_ELEMENT = objects[2];
