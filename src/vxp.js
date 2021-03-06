
    var VxP = function(target, config, csid) {
        return new VxP.fn.init(target, config, csid);
    };

    VxP.fn = VxP.prototype = {
        rendered:  false,
        target:    null,
        container: null,
        csid:      null,
        widget:    null,
        params:    null,

        init: function(target, container, csid) {
            this.target        = target;
            this.container     = container || "telemundohub";
            this.csid          = csid      || "ux-cms-es-us-telemundo";
            this.widget        = this.container + "_refid";
            this.params        = { WidgetReferenceId: this.widget };

            // Make sure to check for the existence of the MsnVideoUx object
            if (typeof MsnVideoUx === "undefined" || typeof MsnVideo2 === "undefined") {
                throw new Error("The MsnVideoUx object must be loaded before instantiating this class.");
            }

            return this;
        },

        configure: function(options) {
            if (!Cortex.isEmptyObject(options)) {
                var params = Cortex.extend(true, this.params, options);
                this.params = params;
            }

            return this;
        },

        play: function(video, forceRender) {
            var key, param,
                self = this,
                target = this.target,
                params = Cortex.extend({}, this.params);

            if (!this.rendered || forceRender) {
                // Build video playback configuration
                if (Cortex.isArray(video) && video.length > 0) {
                    params.DefaultVideo = "videobyuuid.aspx?uuid=" + video[0];
                    if (video.length > 1) {
                        params.DefaultPlaylist = "videobyuuids.aspx?uuids=" + video.join(",");
                    } else {
                        params.DefaultPlaylist = params.DefaultVideo;
                    }
                } else {
                    params.DefaultVideo = "videobyuuid.aspx?uuid=" + video;
                    params.DefaultPlaylist = params.DefaultVideo;
                }

                // Build widgetized configuration
                var config = {};
                for (key in params) {
                    param = String(this.widget + "." + key);
                    config[param] = params[key];
                }

                // Render the video player
                if (MsnVideoUx.render(this.container, this.target, config, { csid: this.csid }) !== false) {
                    $vxp("#" + target).bind("componentReady", function() {
                        self.trigger("componentReady");

                        $vxp("#" + target + "_ux1_1_1").bind("videoChanged", function(event, video) {
                            self.trigger("videoChanged", video);
                        });

                        MsnVideo2.addMessageReceiver({
                            "eventType": "playbackStatusChanged",
                            "widgetId" : target + "_ux1_1_1_1",
                            "funcCb"   : function(event) {
                                self.trigger(event.param.status, event);
                            }
                       });
                    });
                    this.rendered = true;
                } else {
                    throw new Error("Something happened during the rendering of the video player.");
                }
            } else {
                $vxp("#" + target + "_ux1_1_1").trigger("playVideo", video);
            }

            return this;
        }
    };

    VxP.fn.extend = Cortex.extend;

    VxP.fn.extend({
        on: function(types, fn, one) {
            var type, origFn;

            if (typeof types === "object") {
                for (type in types) {
                    this.on(type, types[type], one);
                }
                return this;
            }

            if (fn === false) {
                fn = Cortex.returnFalse;
            } else if (!fn) {
                return this;
            }

            if (one === 1) {
                origFn = fn;
                fn = function() {
                    return origFn.apply(this, arguments);
                };

                // Use same guid so caller can remove using origFn
                fn.guid = origFn.guid || (origFn.guid = Cortex.guid++);
            }

            Cortex.event.add(this, types, fn);

            return this;
        },

        off: function(types, fn) {
            var type;

            if (typeof types === "object") {
                for (type in types) {
                    this.off(type, types[type]);
                }
                return this;
            }

            if (fn === false) {
                fn = Cortex.returnFalse;
            } else if (!fn) {
                return this;
            }

            Cortex.event.remove(this, types, fn);

            return this;
        },

        one: function(types, fn) {
            return this.on(types, fn, 1);
        },

        bind: function(types, fn) {
            return this.on(types, fn);
        },

        unbind: function(types, fn) {
            return this.off(types, fn);
        },

        trigger: function(type, data) {
            return Cortex.event.trigger(type, data, this);
        }
    });

    // Give the init function the VxP prototype for later instantiation
    VxP.fn.init.prototype = VxP.fn;

    // Make VxP available to Cortex
    Cortex.extend({
        vxp: VxP
    });
