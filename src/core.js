
    "use strict";

    var
        // Internal version string
        core_version = "@VERSION",

        // [[Array]] -> type pairs
        array2type = [],

        // [[Class]] -> type pairs
        class2type = {},

        // Save a reference to some core methods
        //core_concat = array2type.concat,
        core_push = array2type.push,
        core_pop = array2type.pop,
        core_slice = array2type.slice,
        core_indexOf = array2type.indexOf,
        core_toString = class2type.toString,
        core_hasOwn = class2type.hasOwnProperty,
        //core_trim = core_version.trim,

        // Used for matching numbers
        //core_pnum = /[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source,

        // Other regular expressions
        core_rnotwhite = /\S+/g,
        //core_rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,
        core_rtypenamespace = /^([^.]*)(?:\.(.+)|)$/,
        core_rdashalpha = /-([\da-z])/gi,

        // Define a local copy of Cortex
        Cortex = function() {
            throw new Error("The Cortex class cannot be instantiated.");
        };

    Cortex.extend = function() {
        var src, copyIsArray, copy, name, options, clone,
            target = arguments[0] || {},
            length = arguments.length,
            deep   = false,
            pos    = 1;

        // Handle a deep copy situation
        if (typeof target === "boolean") {
            deep   = target;
            target = arguments[1] || {};
            // Skip the boolean and the target
            pos = 2;
        }

        // Handle case when target is a string or something (possible in deep copy)
        if (typeof target !== "object" && !Cortex.isFunction(target)) {
            target = {};
        }

        // Extend Cortex itself if only one argument is passed
        if (length === pos) {
            target = this;
            pos -= 1;
        }

        // Perform object modification
        for (; pos<length; pos++) {
            // Only deal with non-null/undefined values
            if ((options = arguments[pos]) !== null) {
                // Extend the base object
                for (name in options) {
                    src  = target[name];
                    copy = options[name];

                    // Prevent never-ending loop
                    if (target === copy) {
                        continue;
                    }

                    // Recurse if we"re merging plain objects or arrays
                    if (deep && copy && (Cortex.isPlainObject(copy) || (copyIsArray = Cortex.isArray(copy)))) {
                        if (copyIsArray) {
                            copyIsArray = false;
                            clone = src && Cortex.isArray(src) ? src : [];
                        } else {
                            clone = src && Cortex.isPlainObject(src) ? src : {};
                        }

                        // Never move original objects, clone them
                        target[name] = Cortex.extend(deep, clone, copy);
                    // Don"t bring in undefined values
                    } else if (copy !== undefined) {
                        target[name] = copy;
                    }
                }
            }
        }

        // Return the modified object
        return target;
    };

    Cortex.extend({
        // Cortex version
        version: core_version,

        // Unique for each copy of Cortex on the page
        expando: "Cortex" + (core_version + Math.random()).replace(/\D/g, ""),

        // A global GUID counter for objects
        guid: 1,

        type: function(obj) {
            if (obj === null) {
                return String(obj);
            }

            return typeof obj === "object" || typeof obj === "function" ?
                class2type[core_toString.call(obj)] || "object" :
                typeof obj;
        },

        isFunction: function(obj) {
            return Cortex.type(obj) === "function";
        },

        isArray: function(obj) {
            return Cortex.type(obj) === "array";
        },

        isWindow: function(obj) {
            return obj !== null && obj === obj.window;
        },

        isNumeric: function(obj) {
            return !isNaN(parseFloat(obj)) && isFinite(obj);
        },

        isArrayLike: function(obj) {
            var length = obj.length,
                type = Cortex.type(obj);

            if (Cortex.isWindow(obj)) {
                return false;
            }
            if (obj.nodeType === 1 && length) {
                return true;
            }

            return type === "array" || type !== "function" &&
                (length === 0 || typeof length === "number" && length > 0 && (length - 1) in obj);
        },

        isPlainObject: function(obj) {
            // Must be an Object.
            // Because of IE, we also have to check the presence of the constructor property.
            // Make sure that DOM nodes and window objects don"t pass through, as well
            if (!obj || Cortex.type(obj) !== "object" || obj.nodeType || Cortex.isWindow(obj)) {
                return false;
            }

            try {
                // Not own constructor property must be Object
                if (obj.constructor &&
                    !core_hasOwn.call(obj, "constructor") &&
                    !core_hasOwn.call(obj.constructor.prototype, "isPrototypeOf") ) {
                    return false;
                }
            } catch (e) {
                return false;
            }

            // Own properties are enumerated firstly, so to speed up,
            // if last one is own, then all properties are own.
            var key, last;
            for (key in obj) {
                last = key;
            }

            return last === undefined || core_hasOwn.call(obj, last);
        },

        isEmptyObject: function(obj) {
            var key;
            for (key in obj) {
                return false;
            }

            return true;
        },

        noop: function() {},

        returnTrue: function() {
            return true;
        },

        returnFalse: function() {
            return false;
        },

        camelCase: function(string) {
            return string.replace(core_rdashalpha, function(all, letter) {
                return letter.toUpperCase();
            });
        },

        nodeName: function(elem, name) {
            return elem.nodeName && elem.nodeName.toLowerCase() === name.toLowerCase();
        },

        makeArray: function(arr, results) {
            var ret = results || [];

            if (arr !== null) {
                if (Cortex.isArrayLike(Object(arr))) {
                    Cortex.merge(ret, typeof arr === "string" ?
                        [arr] :
                        arr
                    );
                } else {
                    core_push.call( ret, arr );
                }
            }

            return ret;
        },

        inArray: function(elem, arr, i) {
            if (arr) {
                return core_indexOf.call(arr, elem, i);
            }

            return -1;
        },

        each: function(obj, callback, args) {
            var value,
                i = 0,
                length = obj.length,
                isArray = Cortex.isArrayLike(obj);

            if (args) {
                if (isArray) {
                    for (; i<length; i++) {
                        value = callback.apply(obj[i], args);
                        if (value === false) {
                            break;
                        }
                    }
                } else {
                    for (i in obj) {
                        value = callback.apply(obj[i], args);
                        if ( value === false ) {
                            break;
                        }
                    }
                }
            } else {
                if (isArray) {
                    for (; i<length; i++) {
                        value = callback.call(obj[i], i, obj[i]);
                        if (value === false) {
                            break;
                        }
                    }
                } else {
                    for (i in obj) {
                        value = callback.call(obj[i], i, obj[i]);
                        if (value === false) {
                            break;
                        }
                    }
                }
            }

            return obj;
        },

        now: function() {
            return (new Date()).getTime();
        }
    });

    // Populate the class2type map
    Cortex.each("Boolean Number String Function Array Date RegExp Object Error".split(" "), function(i, name) {
        class2type[ "[object " + name + "]" ] = name.toLowerCase();
    });

