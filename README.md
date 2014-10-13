Lib.js
======

###A complex library for creating HTML5 animations.  

Feel free to contribute as needed. Contact me [here](mailto:juuanv@gmail.com).

**Documentation**

Read **documentation.html** for a visual breakdown of the *API*.

View the "index.html" file for sample animations with working code you can copy / paste and tweak yourself to learn more about each part of the syntax.

the "graphics" folder contains free sprite and non-sprite images you can use to further expand projects.

**Tests**

The tests folder contains several *demos* used for testing the capabilities of the library. To interact with them,
you must have [Node.js](http://nodejs.org)

To begin testing, make sure you have the `socket.io` dependency installed. Run:

	npm install -g socket.io

To start the test server, make sure you're in the `Lib.js` folder, and type:

	node TestServer
	
It will listen on port `8000`:

	http://localhost:8000/test/3

Type `/test/[NUM]` depending on the test file you'd like to run.