var log = {
	verbose:false,
	out:function(a,b) {
		var doLog = true;
		//properties[0] = 'verbose'
		if(typeof b == 'object' && b.properties[0] && !log.verbose) {
			doLog = false;
		}
		if(doLog) console.log(a);
	}
};
var def = {
	'js':'application/javascript',
	'html':'text/html',
	'png':'image/png',
	'jpg':'image/jpeg',
	'jpeg':'image/jpeg',
	'css':'text/css',
	'ico':'image/x-ico',
	'txt':'text/plain',
	'gif':'image/gif'
};
var rlevts = {};
var readline = require('readline').createInterface({
	input:process.stdin,
	output:process.stdout
}).on('line',function(input) {
	for(var i in rlevts) {
		rlevts[i].forEach(function(item) {
			item.call(this,input);
		});
	}
});
var fs = require('fs'),app = require('http').createServer(function(req,res) {
	var url = req.url == '/' ? '/index.html' : req.url;
	var ext = req.url.split('.');
		ext = ext[ext.length-1];
	if(url.match(/^\/(tests)(\/)/gi)) {
		var urlend = url.split('/');
			urlend = urlend[urlend.length-1];
		if(urlend.match(/^[1-9]+$/gi)) {
			fs.readdir(__dirname+'/tests/',function(err,files) {
				var validFiles = [];
				files.forEach(function(file) {
					if(!file.match(/^(\.)(.*)/gi)) {
						validFiles.push(file);
					}
				});
				route('/tests/'+validFiles[urlend-1]);
			})
		} else {
			route(url);
		}
	} else {
		route(url);
	}

	function route(path) {
		var ext = path.split('.');
			ext = ext[ext.length-1];
		fs.readFile(__dirname+path,function(err,data) {
			if(err) {
				res.writeHead(404);
				return res.end("File Not Found.");
			}
			res.writeHead(200,{'Content-Type':def[ext]});
			res.end(data);
		});
	};
}).listen(8000);

var playerdata = {};

require('socket.io').listen(app,{log:false}).on('connection',function(client) {
	log.out('client '+client.id+' connected');
	rlevts[client.id] = [];
	rlevts[client.id].push(function(input) {
		if(input == '-r') {
			client.emit('command',{command:'refresh'});
		} else if(input == '-v') {
			log.verbose = true;
		}
	});
	client.emit('welcome',{id:client.id,playerdata:playerdata});
	client.on('playerregister',function(data) {
		log.out('registering client '+data.id);
		playerdata[data.id] = data;
		client.emit('playerregister',data);
	});
	client.on('playerdata',function(data) {
		log.out('client '+client.id+' sent player data');
		client.broadcast.emit('playerdata',data);
	});
	client.on('playerupdate',function(data) {
		log.out('client '+data.id+' has requested update',{properties:[1]});
		playerdata[data.id] = data.playerdata;
		client.broadcast.emit('playerupdate',data);
	});
	client.on('disconnect',function() {
		log.out('client '+client.id+' disconnected');
		client.broadcast.emit('playerdisconnect',{id:client.id});
		delete playerdata[client.id];
		delete rlevts[client.id];
	});
});