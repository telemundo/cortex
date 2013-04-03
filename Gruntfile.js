/*global module,Buffer,process */
module.exports = function(grunt) {

    "use strict";

    var distpaths = [
            "dist/cortex.js",
            "dist/cortex.min.map",
            "dist/cortex.min.js"
        ];

    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),

        dst: {},

        compare_size: {
            files: distpaths
        },

        build: {
            all: {
                dest: "dist/<%= pkg.name %>.js",
                src: [
                    "src/intro.js",
                    "src/core.js",
                    "src/data.js",
                    "src/event.js",
                    { flag: "vxp", src: "src/vxp.js" },
                    "src/exports.js",
                    "src/outro.js"
                ]
            }
        },

        jshint: {
            dist: {
                src: [ "dist/<%= pkg.name %>.js" ],
                options: {
                    jshintrc: "src/.jshintrc"
                }
            }
        },

        watch: {
            files: [ "src/**/*.js" ],
            tasks: "dev"
        },

        uglify: {
            all: {
                files: {
                    "dist/cortex.min.js": [ "dist/<%= pkg.name %>.js" ]
                },
                options: {
                    banner: "/*! Cortex v<%= pkg.version %> | (c) 2013 Telemundo Digital Media */",
                    sourceMap: "dist/<%= pkg.name %>.min.map",
                    beautify: {
                        ascii_only: true
                    }
                }
            }
        }
    });

    // Special concat/build task to handle various jQuery build requirements
    grunt.registerMultiTask(
        "build",
        "Concatenate source (include/exclude modules with +/- flags), embed date/version",
        function() {
            // Concat specified files.
            var compiled = "",
                modules = this.flags,
                optIn = !modules["*"],
                explicit = optIn || Object.keys(modules).length > 1,
                name = this.data.dest,
                src = this.data.src,
                deps = {},
                excluded = {},
                version = grunt.config("pkg.version"),
                excluder = function(flag, needsFlag) {
                    // optIn defaults implicit behavior to weak exclusion
                    if (optIn && !modules[flag] && !modules["+" + flag]) {
                        excluded[flag] = false;
                    }

                    // explicit or inherited strong exclusion
                    if (excluded[needsFlag] || modules["-" + flag]) {
                        excluded[flag] = true;

                    // explicit inclusion overrides weak exclusion
                    } else if (excluded[needsFlag] === false && (modules[flag] || modules["+" + flag])) {
                        delete excluded[needsFlag];
                        // ...all the way down
                        if (deps[needsFlag]) {
                            deps[needsFlag].forEach(function(subDep) {
                                modules[needsFlag] = true;
                                excluder(needsFlag, subDep);
                            });
                        }
                    }
                };

            // append commit id to version
            if (process.env.COMMIT) {
                version += " " + process.env.COMMIT;
            }

            // figure out which files to exclude based on these rules in this order:
            //  dependency explicit exclude
            //  > explicit exclude
            //  > explicit include
            //  > dependency implicit exclude
            //  > implicit exclude
            // examples:
            //  *                  none (implicit exclude)
            //  *:*                all (implicit include)
            //  *:*:-vxp           all except vxp and dependents (explicit > implicit)
            //  *:*:-vxp:+rankit   same (excludes rankit because explicit include is trumped by explicit exclude of dependency)
            //  *:+rankit          none except rankit and its dependencies (explicit include trumps implicit exclude of dependency)
            src.forEach(function(filepath) {
                var flag = filepath.flag;

                if (flag) {
                    excluder(flag);

                    // check for dependencies
                    if (filepath.needs) {
                        deps[flag] = filepath.needs;
                        filepath.needs.forEach(function(needsFlag) {
                            excluder(flag, needsFlag);
                        });
                    }
                }
            });

            // append excluded modules to version
            if (Object.keys(excluded).length) {
                version += " -" + Object.keys(excluded).join(",-");
                // set pkg.version to version with excludes, so minified file picks it up
                grunt.config.set("pkg.version", version);
            }


            // conditionally concatenate source
            src.forEach(function(filepath) {
                var flag = filepath.flag,
                    specified = false,
                    omit = false,
                    messages = [];

                if (flag) {
                    if (excluded[flag] !== undefined) {
                        messages.push([
                            ("Excluding " + flag).red,
                            ("(" + filepath.src + ")").grey
                        ]);
                        specified = true;
                        omit = !filepath.alt;
                        if (!omit) {
                            flag += " alternate";
                            filepath.src = filepath.alt;
                        }
                    }
                    if (excluded[flag] === undefined) {
                        messages.push([
                            ("Including " + flag).green,
                            ("(" + filepath.src + ")").grey
                        ]);

                        // If this module was actually specified by the
                        // builder, then set the flag to include it in the
                        // output list
                        if (modules["+" + flag]) {
                            specified = true;
                        }
                    }

                    filepath = filepath.src;

                    // Only display the inclusion/exclusion list when handling
                    // an explicit list.
                    //
                    // Additionally, only display modules that have been specified
                    // by the user
                    if (explicit && specified) {
                        messages.forEach(function(message) {
                            grunt.log.writetableln([ 27, 30 ], message);
                        });
                    }
                }

                if (!omit) {
                    compiled += grunt.file.read(filepath);
                }
            });

            // Embed Version
            // Embed Date
            compiled = compiled.replace(/@VERSION/g, version)
                .replace("@DATE", function() {
                    var date = new Date();

                    // YYYY-MM-DD
                    return [
                        date.getFullYear(),
                        date.getMonth() + 1,
                        date.getDate()
                    ].join("-");
                });

            // Write concatenated source to file
            grunt.file.write(name, compiled);

            // Fail task if errors were logged.
            if (this.errorCount) {
                return false;
            }

            // Otherwise, print a success message.
            grunt.log.writeln("File '" + name + "' created.");
        }
    );

    // Process files for distribution
    grunt.registerTask("dist", function() {
        var flags, paths, stored,
            fs = require("fs"),
            nonascii = false;

        // Check for stored destination paths
        // ( set in dist/.destination.json )
        stored = Object.keys(grunt.config("dst"));

        // Allow command line input as well
        flags = Object.keys(this.flags);

        // Combine all output target paths
        paths = [].concat(stored, flags).filter(function(path) {
            return path !== "*";
        });

        distpaths.forEach(function(filename) {
            var i, c, map,
                text = fs.readFileSync(filename, "utf8");

            // Ensure files use only \n for line endings, not \r\n
            if (/\x0d\x0a/.test(text)) {
                grunt.log.writeln(filename + ": Incorrect line endings (\\r\\n)");
                nonascii = true;
            }

            // Ensure only ASCII chars so script tags don"t need a charset attribute
            if (text.length !== Buffer.byteLength(text, "utf8")) {
                grunt.log.writeln(filename + ": Non-ASCII characters detected:");
                for (i = 0; i < text.length; i++) {
                    c = text.charCodeAt(i);
                    if (c > 127) {
                        grunt.log.writeln("- position " + i + ": " + c);
                        grunt.log.writeln("-- " + text.substring(i - 20, i + 20));
                        break;
                    }
                }
                nonascii = true;
            }

            // Modify map/min so that it points to files in the same folder;
            // see https://github.com/mishoo/UglifyJS2/issues/47
            if (/\.map$/.test(filename)) {
                text = text.replace(/"dist\//g, "\"");
                fs.writeFileSync(filename, text, "utf-8");
            } else if (/\.min\.js$/.test(filename)) {
                // Wrap sourceMap directive in multiline comments (#13274)
                text = text.replace(/\n?(\/\/@\s*sourceMappingURL=)(.*)/,
                    function(_, directive, path) {
                        map = "\n" + directive + path.replace(/^dist\//, "");
                        return "";
                    });
                if (map) {
                    text = text.replace(/(^\/\*[\w\W]*?)\s*\*\/|$/,
                        function(_, comment) {
                            return (comment || "\n/*") + map + "\n*/";
                        });
                }
                fs.writeFileSync(filename, text, "utf-8");
            }

            // Optionally copy dist files to other locations
            paths.forEach(function(path) {
                var created;

                if (!/\/$/.test(path)) {
                    path += "/";
                }

                created = path + filename.replace("dist/", "");
                grunt.file.write(created, text);
                grunt.log.writeln("File '" + created + "' created.");
            });
        });

        return !nonascii;
    });

    // Load grunt tasks from NPM packages
    grunt.loadNpmTasks("grunt-compare-size");
    grunt.loadNpmTasks("grunt-git-authors");
    grunt.loadNpmTasks("grunt-contrib-watch");
    grunt.loadNpmTasks("grunt-contrib-jshint");
    grunt.loadNpmTasks("grunt-contrib-uglify");

    // Default grunt
    grunt.registerTask("default", [ "build:*:*", "jshint", "uglify", "dist:*", "compare_size" ]);

    // Short list as a high frequency watch task
    grunt.registerTask("dev", [ "build:*:*", "jshint" ]);
};
