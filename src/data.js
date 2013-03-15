
    Cortex.extend({
        cache: {},

        data: function( elem, name, data ) {
            return internalData( elem, name, data );
        },

        _data: function( elem, name, data ) {
            return internalData( elem, name, data, true );
        }
    });

    function internalData(elem, name, data, pvt) {
        var thisCache, ret,
            internalKey = Cortex.expando,
            getByName   = typeof name === "string",

            // We have to handle DOM nodes and JS objects differently because IE6-7
            // can't GC object references properly across the DOM-JS boundary
            isNode = elem.nodeType,

            // Only DOM nodes need the global Cortex cache; JS object data is
            // attached directly to the object so GC can occur automatically
            cache = isNode ? Cortex.cache : elem,

            // Only defining an ID for JS objects if its cache already exists allows
            // the code to shortcut on the same path as a DOM node with no cache
            id = isNode ? elem[internalKey] : elem[internalKey] && internalKey;

        // Avoid doing any more work than we need to when trying to get data on an
        // object that has no data at all
        if ((!id || !cache[id] || (!pvt && !cache[id].data)) && getByName && data === undefined) {
            return;
        }

        if (!id) {
            // Only DOM nodes need a new unique ID for each element since their data
            // ends up in the global cache
            if (isNode) {
                elem[internalKey] = id = __pop() || Cortex.guid++;
            } else {
                id = internalKey;
            }
        }

        if (!cache[id]) {
            cache[id] = {};
            // Avoids exposing Cortex metadata on plain JS objects when the object
            // is serialized using JSON.stringify
            if (!isNode) {
                cache[id].toJSON = Cortex.noop;
            }
        }

        // An object can be passed to Cortex.data instead of a key/value pair; this gets
        // shallow copied over onto the existing cache
        if (typeof name === "object" || typeof name === "function") {
            if (pvt) {
                cache[id] = Cortex.extend(cache[id], name);
            } else {
                cache[id].data = Cortex.extend(cache[id].data, name);
            }
        }

        thisCache = cache[id];

        // Cortex data() is stored in a separate object inside the object's internal data
        // cache in order to avoid key collisions between internal data and user-defined
        // data.
        if (!pvt) {
            if (!thisCache.data) {
                thisCache.data = {};
            }
            thisCache = thisCache.data;
        }

        if (data !== undefined) {
            thisCache[Cortex.camelCase(name)] = data;
        }

        // Check for both converted-to-camel and non-converted data property names
        // If a data property was specified
        if (getByName) {
            // First Try to find as-is property data
            ret = thisCache[name];

            // Test for null|undefined property data
            if (ret == null) {
                // Try to find the camelCased property
                ret = thisCache[Cortex.camelCase(name)];
            }
        } else {
            ret = thisCache;
        }

        return ret;
    }
