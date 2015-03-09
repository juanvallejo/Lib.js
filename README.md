Lib.js
======

###A complex library for creating HTML5 animations.  

Feel free to contribute as needed. Contact me [here](mailto:juuanv@gmail.com).

####Documentation

Read **docs/index.html** for a visual breakdown of the *API*.

View the `demos.html` file for sample animations with working code you can copy / paste and tweak yourself to learn more about each part of the syntax.

the `graphics` folder contains sprite and non-sprite images you can use to further test the library.

###Dependencies

- [Lib.js](https://github.com/juanvallejo/Lib.js)
- [Node.js](http://nodejs.org/)
- [socket.io](http://socket.io/)

Before this game can be run, you must have the dependencies listed above. To install these dependencies, see below for your operating system.

**Mac**

On a mac, make sure you have the [homebrew](http://brew.sh/) package manager installed. Then use it to install `Node.js` with the line below.
	
	brew install node

Then, install the node package manager (`npm`), with the line below.

	brew install npm

**Linux**

On a linux environment, make sure you have `curl` installed and use the lines below to install the latest version of `Node.js`.

	echo 'export PATH=$HOME/local/bin:$PATH' >> ~/.bashrc
	. ~/.bashrc
	
	mkdir ~/local
	mkdir ~/node-latest && cd ~/node-latest-install
	
	curl http://nodejs.org/dist/node-latest.tar.gz | tar xz --strip-components=1
	./configure --prefix=~/local
	make install
	
Afterwards, install the node package manager (`npm`) with the line below.
	
	curl -L https://npmjs.org/install.sh | sh

####Tests

The tests folder contains several **demos** used for testing the capabilities of the library. To interact with them, you must have [Node.js](http://nodejs.org) installed.

To begin testing, make sure you have the `socket.io` `Node.js` dependency installed. Run:

	npm install -g socket.io

To start the test server, make sure you're in the `Lib.js` folder, and type:

	node TestServer
	
It will listen on port `8000`:

	http://localhost:8000/test/3

Open the url `http://localhost:8000/test/{TEST_FILE_NUM}` depending on the test file you'd like to run.
