
    Cortex.Event = function(src, props) {
        // Allow instantiation without the "new" keyword
        if (!(this instanceof Cortex.Event)) {
            return new Cortex.Event(src, props);
        }

        if (src && src.type) {
            this.original = src;
            this.type     = src.type;
        } else {
            this.type     = src;
        }

        // Put explicitly provided properties onto the event object
        if (props) {
            Cortex.extend(this, props);
        }

        // Create a timestamp if incoming event doesn"t have one
        this.timeStamp = src && src.timeStamp || Cortex.now();
    };

    Cortex.event = {
        global: {},

        add: function(elem, types, handler) {
            var tmp, events, t, handleObjIn,
                eventHandle, handleObj, handlers,
                type, namespaces, origType,
                elemData = Cortex._data(elem);

            // Don"t attach events to noData or text/comment nodes (but allow plain objects)
            if (!elemData) {
                return;
            }

            // Caller can pass in an object of custom data in lieu of the handler
            if (handler.handler) {
                handleObjIn = handler;
                handler     = handleObjIn.handler;
            }

            // Make sure that the handler has a unique ID, used to find/remove it later
            if (!handler.guid) {
                handler.guid = Cortex.guid++;
            }

            // Init the element"s event structure and main handler, if this is the first
            if (!(events = elemData.events)) {
                events = elemData.events = {};
            }

            if (!(eventHandle = elemData.handle)) {
                eventHandle = elemData.handle = function(e) {
                    // Discard the second event of a Cortex.event.trigger() and
                    // when an event is called after a page has unloaded
                    return (!e || Cortex.event.triggered !== e.type) ?
                        Cortex.event.dispatch.apply(eventHandle.elem, arguments) :
                        undefined;
                };

                // Add elem as a property of the handle fn to prevent a memory leak with IE non-native events
                eventHandle.elem = elem;
            }

            // Handle multiple events separated by a space
            // Cortex.vxpWidget(...).bind("componentReady videoChanged", fn);
            types = (types || "").match(core_rnotwhite) || [""];
            t = types.length;
            while (t--) {
                tmp = core_rtypenamespace.exec(types[t]) || [];
                type = origType = tmp[1];
                namespaces = (tmp[2] || "").split(".").sort();

                // handleObj is passed to all event handlers
                handleObj = Cortex.extend({
                    type:      type,
                    origType:  origType,
                    handler:   handler,
                    guid:      handler.guid,
                    namespace: namespaces.join(".")
                }, handleObjIn);

                // Init the event handler queue if we"re the first
                if (!(handlers = events[type])) {
                    handlers = events[type] = [];
                    handlers.delegateCount = 0;
                }

                // Add to the element"s handler list, delegates in front
                handlers.push(handleObj);

                // Keep track of which events have ever been used, for event optimization
                Cortex.event.global[type] = true;
            }

            // Nullify elem to prevent memory leaks in IE
            elem = null;
        },

        trigger: function(event, data, elem) {
            var handle, cur, i,
                eventPath  = [elem || document],
                type       = core_hasOwn.call(event, "type") ? event.type : event,
                namespaces = core_hasOwn.call(event, "namespace") ? event.namespace.split(".") : [];

            elem = elem || document;

            // Don"t do events on text and comment nodes
            if (elem.nodeType === 3 || elem.nodeType === 8) {
                return;
            }

            if (type.indexOf(".") >= 0) {
                // Namespaced trigger; create a regexp to match event type in handle()
                namespaces = type.split(".");
                type = namespaces.shift();
                namespaces.sort();
            }

            // Caller can pass in a Cortex.Event object, Object, or just an event type string
            event = event[Cortex.expando] ?
                event :
                new Cortex.Event(type, typeof event === "object" && event);

            event.isTrigger = true;
            event.namespace = namespaces.join(".");
            event.namespace_re = event.namespace ?
                new RegExp( "(^|\\.)" + namespaces.join("\\.(?:.*\\.|)") + "(\\.|$)" ) :
                null;

            // Clean up the event in case it is being reused
            event.result = undefined;
            if (!event.target) {
                event.target = elem;
            }

            // Clone any incoming data and prepend the event, creating the handler arg list
            data = (data === null) ?
                [event] :
                Cortex.makeArray(data, [event]);

            // Fire handlers on the event path
            i = 0;
            while ((cur = eventPath[i++])) {
                event.type = type;
                handle     = (Cortex._data(cur, "events") || {})[event.type] && Cortex._data(cur, "handle");
                if (handle) {
                    handle.apply(cur, data);
                }
            }

            event.type = type;

            return event.result;
        },

        dispatch: function(event, data) {
            // Make a writable Cortex.Event from the native event object
            event = Cortex.event.fix(event);

            var i, handleObj, handlerQueue, matched, j,
                args         = core_slice.call(arguments),
                handlers     = (Cortex._data(this, "events") || {})[event.type] || [];

            // Use the fix-ed Cortex.Event rather than the (read-only) native event
            args[0] = event;
            event.data     = data;
            event.delegate = this;

            // Determine handlers
            handlerQueue = Cortex.event.handlers.call(this, event, handlers);

            // Run delegates first; they may want to stop propagation beneath us
            i = 0;
            while ((matched = handlerQueue[i++])) {
                j = 0;
                while ((handleObj = matched.handlers[j++])) {
                    // Triggered event must either 1) have no namespace, or
                    // 2) have namespace(s) a subset or equal to those in the bound event (both can have no namespace).
                    if (!event.namespace_re || event.namespace_re.test(handleObj.namespace)) {
                        event.handleObj = handleObj;

                        (handleObj.handler).apply(matched.elem, args);
                    }
                }
            }

            return event.result;
        },

        handlers: function(event, handlers) {
            var handlerQueue  = [],
                delegateCount = handlers.delegateCount,
                cur           = event.target;

            if (delegateCount < handlers.length) {
                handlerQueue.push({ elem: cur, handlers: handlers.slice(delegateCount) });
            }

            return handlerQueue;
        },

        fix: function(event) {
            if (event[Cortex.expando]) {
                return event;
            }

            return new Cortex.Event(event);
        }
    };
