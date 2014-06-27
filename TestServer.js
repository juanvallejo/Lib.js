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
var fs = require('fs'),http = require('http').createServer(function(req,res) {
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