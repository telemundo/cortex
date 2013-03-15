Cortex
======

Core JavaScript library for [Telemundo.com](http://telemundo.com).


How to build your own Cortex
----------------------------

First, clone a copy of the main Cortex git repo by running:

```bash
git clone git://github.com/telemundo/cortex.git
```

Install the grunt-cli package so that you will have the correct version of grunt available from any project that needs it. This should be done as a global install:

```bash
npm install -g grunt-cli
```

Enter the `cortex` directory and install the Node dependencies, this time *without* specifying a global install:

```bash
cd cortex && npm install
```

Make sure you have `grunt` installed by testing:

```bash
grunt -version
```

Then, to get a complete, minified (w/ Uglify.js), linted (w/ JSHint) version of Cortex, type the following:

```bash
grunt --force
```

The built version of Cortex will be put in the `dist/` subdirectory, along with the minified copy and associated map file.


Building to a different directory
---------------------------------

To copy the built Cortex files from `/dist` to another directory:

```bash
grunt && grunt dist:/path/to/other/location/
```

With this example, the output files would be:

```bash
/path/to/other/location/cortex.js
/path/to/other/location/cortex.min.js
```

To add a permanent copy destination, create a file in `dist/` called `.destination.json`. Inside the file, paste and customize the following:

```json

{
  "/path/to/other/location": true
}
```

Additionally, both methods can be combined.


Submitting bugs and feature requests
------------------------------------

Bugs and feature request are tracked on [GitHub](https://github.com/telemundo/cortex/issues).


Authors
-------

Rodolfo Puig - [@rudisimo](https://twitter.com/rudisimo)  


License
-------

This package is licensed under the MIT License - see the LICENSE.txt file for details.


Acknowledgements
----------------

This library is heavily inspired by the [jQuery](http://jquery.com) library; created by the jQuery Foundation and other contributors.
