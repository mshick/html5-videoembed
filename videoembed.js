(function() {
    var IE = document.all,
        JQUERY = typeof jQuery == 'function',
        GLOBAL_OPTS = {
            controls: true,
            autoplay: false,
            id: 'video',
            classes: 'video-stream',
            playlistContainerId: 'videoembed-playlist',
            playlistItemsClass: 'playlist-item'
        };

    // simple extend

    function extend(to, from) {
        if (from) {
            for (var key in from) {
                if (from.hasOwnProperty(key)) {
                    to[key] = from[key];
                }
            }
        }
        return to;
    }

    function getElementsByClassName(oElm, strTagName, strClassName) {
        var arrElements = (strTagName == "*" && oElm.all) ? oElm.all : oElm.getElementsByTagName(strTagName);
        var arrReturnElements = new Array();
        strClassName = strClassName.replace(/\-/g, "\\-");
        var oRegExp = new RegExp("(^|\\s)" + strClassName + "(\\s|$)");
        var oElement;
        for (var i = 0; i < arrElements.length; i++) {
            oElement = arrElements[i];
            if (oRegExp.test(oElement.className)) {
                arrReturnElements.push(oElement);
            }
        }
        return (arrReturnElements)
    }

    window.videoembed = function(root, opts, conf) {

        // root must be found / loaded
        if (typeof root == 'string') {
            root = document.getElementById(root.replace("#", ""));
        }

        // not found
        if (!root) {
            return;
        }

        if (typeof opts == 'string') {
            opts = {
                src: opts
            };
        }

        return new Video(root, extend(extend({}, GLOBAL_OPTS), opts), conf);
    };


    function Video(root, opts, conf) {
        var self = this;

        var videoObj = v.getVideo(opts, conf);
        var htmlObj = v.getHtml(root, opts, conf);

        var contentDiv = root.appendChild(htmlObj.contentDiv);
        contentDiv.appendChild(videoObj.video);
        contentDiv.appendChild(htmlObj.loaderDiv);
        contentDiv.appendChild(htmlObj.playDiv);
        contentDiv.appendChild(htmlObj.posterImg);

        // register video events
        v.registerVideoEvents(root, opts, conf);

        // register playlist events
        p.registerPlaylistEvents(root, opts, conf);

        // API methods for callback
        extend(self, {

            root: function() {
                return root;
            },

            options: function() {
                return opts;
            },

            conf: function() {
                return conf;
            },

            player: function() {
                return root.firstChild;
            },

            pos: function() {
                return p.playlistCounter;
            },

            inter: function() {
                v.inter = 2;
                return true;
            },

            next: function() {
                p.playlistNext();
            },

            prev: function() {
                p.playlistPrev();
            },

            pause: function() {
                v.videoPause();
            },

            play: function(i) {
                if (typeof i != 'undefined') {
                    i = i - 1;
                    p.playlistPlay(i);
                } else {
                    v.videoPlay();
                }
            }

        });
    };

    var v = extend(window.videoembed, {
        conf: GLOBAL_OPTS,
        playlistCounter: 0,
        playlistLength: 0,
        inter: 0,
        firstPlay: true,

        events: {
            loadstart: 'onBegin',
            ended: 'onFinish',
            play: 'onStart',
            pause: 'onPause',
            seeked: 'onSeek',
            seeking: 'onSeeking',
            mouseover: 'onMouseOver',
            mouseout: 'onMouseOut',
            volumechange: 'onVolume'
        },

        getHtml: function(root, opts, conf) {
            var htmlObj = {};

            var content = document.createElement("div");
            content.id = 'video-content';
            htmlObj.contentDiv = content;

            var loader = document.createElement("div");
            loader.className = "html5-video-loader html5-center-overlay html5-icon";
            htmlObj.loaderDiv = loader;

            var playButton = document.createElement("div");
            playButton.className = 'html5-big-play-button html5-center-overlay html5-mobile-big-play-button';
            htmlObj.playDiv = playButton;

            var poster = document.createElement("img");
            poster.className = 'video-thumbnail';
            poster.src = v.videoObj.video.poster;
            htmlObj.posterImg = poster;
            
            v.htmlObj = htmlObj;
            v.toggle = v.togglePoster(root, htmlObj);

            return htmlObj;
        },

        getVideo: function(opts, conf) {

            opts = extend({}, opts);

            var videoPlayer = {};

            var video = document.createElement("video");
            video.id = opts.id;
            video.className = opts.classes;
            video.controls = opts.controls;

            if (typeof opts.src == 'string') {
                videoPlayer.type = 'player';
                video.src = opts.src;
            }
            else if (typeof opts.src == 'object') {
                if (opts.src.length === 1) {
                    videoPlayer.type = 'player';
                    video.src = opts.src;
                }
                else {
                    // becomes a playlist
                    videoPlayer.type = 'playlist';
                    videoPlayer.sources = [];
                    for (i in opts.src) {
                        videoPlayer.sources[i] = opts.src[i];
                    }
                    v.playlistLength = videoPlayer.sources.length;
                    video.src = videoPlayer.sources[0];
                }

            }

            if (typeof opts.poster == 'string') {
                video.poster = opts.poster;
            }
            else if (typeof opts.poster == 'object') {

                // playlist multiple posters
                videoPlayer.posters = [];
                for (i in opts.poster) {
                    videoPlayer.posters[i] = opts.poster[i];
                }
                video.poster = videoPlayer.posters[0];
            }
            videoPlayer.video = video;
            v.videoObj = videoPlayer;

            return videoPlayer;

        },

        registerVideoEvents: function(root, opts, conf) {
            for (var e in v.events) {
                v.videoObj.video.addEventListener(e, v[e + 'Handler'](), false);
            }
            v.htmlObj.playDiv.addEventListener("click", v.firstplayHandler(), false);
            extend(v.events, {
                firstplay: 'onFirstPlay'
            });

            return true;
        },

        videoLoad: function(i) {
            if (typeof(i) != 'undefined') {
                p.playlistCounter = i;
            }
            v.videoObj.video.src = v.videoObj.sources[p.playlistCounter];
            v.videoObj.video.load();
        },

        videoPlay: function() {
            v.videoObj.video.play();
        },

        videoPause: function() {
            v.videoObj.video.pause();
        },

        togglePoster: function(root, htmlObj) {
            return function() {
                root.className = 'html5-video-player html5-native controls';
                htmlObj.playDiv.style.display = 'none';
                htmlObj.posterImg.style.display = 'none';
            }
        },

        firstplayHandler: function() {
            return function(event) {
                v.fireEvent('firstplay');
                v.firstPlay = false;
                v.toggle();
                v.videoPlay();
            }
        },

        loadstartHandler: function() {
            return function(event) {
                var opt = v.firstPlay ? 'firstPlay' : false;
                if (v.inter === 0 || v.inter === 1) {
                    if (v.inter === 0) {
                        v.fireEvent(event.type, opt);
                    } else {
                        v.inter--;
                    }

                    if (!v.firstPlay) {
                        v.videoPlay();
                    }
                } else if (v.inter === 2) {
                    v.inter--;
                    p.playlistCounter--;
                }
            }
        },

        endedHandler: function() {
            return function(event) {
                if (v.inter && v.videoObj.type == 'player') {
                    v.videoLoad(0);
                } else if (!v.inter) {
                    v.fireEvent(event.type);
                }
                if (v.videoObj.type == 'playlist' && v.firstPlay == false) {
                    p.playlistNext();
                }
            }
        },

        playHandler: function() {
            return function(event) {
                v.fireEvent(event.type);
            }
        },

        pauseHandler: function() {
            return function(event) {
                v.fireEvent(event.type);
            }
        },

        seekedHandler: function() {
            // @todo doesn't work consistently
            return function(event) {
                v.fireEvent(event.type, v.videoObj.video.currentTime);
            }
        },

        seekingHandler: function() {
            // @todo doesn't work consistently
            return function(event) {
                v.fireEvent(event.type, v.videoObj.video.currentTime);
            }
        },

        mouseoverHandler: function() {
            return function(event) {
                v.fireEvent(event.type);
            }
        },

        mouseoutHandler: function() {
            return function(event) {
                v.fireEvent(event.type);
            }
        },

        volumechangeHandler: function() {
            return function(event) {
                v.fireEvent(event.type);
            }
        },

        fireEvent: function(event, opt1) {
            if (typeof window.videoplayer == 'object' && typeof window.videoplayer.fireEvent == 'function') {
                // don't want to report -1 if an ad is playing
                var counter = (p.playlistCounter >= 0) ? p.playlistCounter : 0;
                // externally index begins as 1
                counter++;
                
                // external event handler
                window.videoplayer.fireEvent(v.videoObj.video.id, v.events[event], counter, opt1);
            }
        }
    });

    var p = extend(window.videoembed, {
        playlistCounter: 0,
        playlistLength: 0,

        playlistPlay: function(i) {
            if (v.firstPlay) {
                v.fireEvent('firstplay');
                v.firstPlay = false;
                v.toggle();
            }
            if (0 <= i && i <= p.playlistLength) {
                if (v.inter) {
                    p.playlistCounter = i;
                } else {
                    v.videoLoad(i);
                }
            }
        },

        playlistNext: function() {
            if (v.firstPlay) {
                v.fireEvent('firstplay');
                v.firstPlay = false;
                v.toggle();
            }
            p.playlistCounter++;
            if (0 <= p.playlistCounter && p.playlistCounter <= p.playlistLength) {
                v.videoLoad();
            }
        },

        playlistPrev: function() {
            if (v.firstPlay) {
                v.fireEvent('firstplay');
                v.firstPlay = false;
                v.toggle();
            }
            p.playlistCounter--;
            if (0 <= p.playlistCounter && p.playlistCounter <= p.playlistLength) {
                v.videoLoad();
            }
        },

        playlistItemClickHandler: function() {
            return function(event) {
                var i = Number(this.parentNode.getAttribute('rel')) - 1;
                p.playlistPlay(i);
            }
        },

        registerPlaylistEvents: function(root, opts, conf) {
            var playlistItems = getElementsByClassName(document.getElementById(opts.playlistContainerId), "li", opts.playlistItemsClass);
            for (var i in playlistItems) {
                playlistItems[i].firstChild.addEventListener("click", p.playlistItemClickHandler(), false);
            }

            return true;
        }

    });

    // setup jquery support
    if (JQUERY) {

        // tools version number
        jQuery.tools = jQuery.tools || {
            version: '0.0.0'
        };

        jQuery.tools.videoembed = {
            conf: GLOBAL_OPTS
        };

        jQuery.fn.videoembed = function(opts, conf) {
            return this.each(function() {
                $(this).data("videoembed", videoembed(this, opts, conf));
            });
        };
    }

})();
