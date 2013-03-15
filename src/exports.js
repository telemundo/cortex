
    if (typeof module === "object" && typeof module.exports === "object") {
        // Expose Cortex as module.exports in loaders that implement the Node
        // module pattern (including browserify). Do not create the global, since
        // the user will be storing it themselves locally, and globals are frowned
        // upon in the Node module world.
        module.exports = Cortex;
    } else {
        // Otherwise expose Cortex to the global object as usual
        window.Cortex = Cortex;

        // Register as a named AMD module, since Cortex can be concatenated with other
        // files that may use define, but not via a proper concatenation script that
        // understands anonymous AMD modules. A named AMD is safest and most robust
        // way to register. Lowercase jquery is used because AMD module names are
        // derived from file names, and Cortex is normally delivered in a lowercase
        // file name. Do this after creating the global so that if an AMD module wants
        // to call noConflict to hide this version of Cortex, it will work.
        if (typeof define === "function" && define.amd) {
            define("cortex", [], function() {
                return Cortex;
            });
        }
    }
