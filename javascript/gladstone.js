/**
 * Gladstone v0.1
 * https://github.com/komarnicki/gladstone
 *
 * Date 2015-11-03 19:40:45
 *
 * With a very few steps, Gladstone gives you a phenomenal ability to put some custom markers across the globe and link
 * them with dedicated stories. Read each of them, enjoy stunning pictures and finally jump from point to point to
 * experience great adventure with some unique content.
 *
 * @param key
 * @param canvas
 * @param markers
 * @param options
 * @constructor
 */
function Gladstone(key, canvas, markers, options) {

    try {

        this.key = key;
        this.canvas = canvas;
        this.markers = markers;
        this.options = {
            'lang': 'en',
            'slugs': false,
            'urlRoot': 'http://gladstone.local/',
            'urlMap': 'http://gladstone.local/map/',
            'storyAutoOpen': 0
        };

        this.options = this.mergeOptions(this.options, options);

        var self = this;

        /**
         * Load Google Maps API asynchronously to keep index file as clean as possible.
         * Once API is loaded, trigger the callback function that's within window scope.
         *
         * @private
         */
        window.onload = function _() {
            var _s = document.createElement('script');
            _s.src = 'https://maps.googleapis.com/maps/api/js?key=' + self.key + '&callback=_c';
            document.body.appendChild(_s);
        };

        /**
         * This callback is responsible for initiating whole map as well as setting up HTML markup and markers.
         * On this stage we can be sure that if key is correct, API is fully loaded and "google" object is not undefined
         * and ready to work.
         *
         * @private
         */
        window._c = function() {

            self.setMarkup();
            self.initiate();

            /**
             * Once the map is initiated, trigger click event on particular continent control icon.
             * Each element with class "continent_handler" holds the ID attribute that is assigned to specific bounds.
             *
             * Clicking on "continent_handler" with ID equal to "australia" will extend map bounds to show all markers
             * assigned to this continent.
             *
             * ID "all_continents" shows all markers at once. Change below ID name to set default continent or leave it
             * to see all markers once the map is idle.
             */
            document.getElementById('all_continents').click();
        };

    } catch(e) {
        console.log(e);
    }
}

/**
 * Combines Gladstone "options" object with input object giving precedence to the source.
 *
 * @param target
 * @param source
 * @returns {{}}
 */
Gladstone.prototype.mergeOptions = function (target, source) {

    var merged = {};

    if (typeof source !== 'object') {
        source = {};
    }

    for (var property in target) {
        if (target.hasOwnProperty(property)) {
            merged[property] = target[property];
        }
    }

    for (var property in source) {
        if (source.hasOwnProperty(property)) {
            merged[property] = source[property];
        }
    }

    return merged;
};

/**
 * Method sets essential objects that hold information about the map, markers and related stories.
 * Finally "setMarkers" method is triggered once the Google Map is instantiated.
 */
Gladstone.prototype.initiate = function () {

    try {

        this._map = {
            'container': document.getElementById(this.canvas),
            'options': {
                'styles': [{featureType:'administrative',elementType:'all',stylers:[{visibility:'off'}]},{featureType:'landscape',elementType:'all',stylers:[{hue:'#FFFFFF'},{saturation:-100},{lightness:100},{visibility:'on'}]},{featureType:'poi',elementType:'all',stylers:[{visibility:'off'}]},{featureType:'road',elementType:'all',stylers:[{visibility:'on'},{lightness:-30}]},{featureType:'road',elementType:'labels',stylers:[{visibility:'off'}]},{featureType:'transit',elementType:'all',stylers:[{visibility:'off'}]},{featureType:'water',elementType:'all',stylers:[{saturation:-100},{lightness:-100}]},{featureType:'landscape',elementType:'labels.text',stylers:[{visibility:'off'}]},{featureType:'all',elementType:'all',stylers:[{saturation:-100},{lightness:91}]}],
                'zoom': 5,
                'minZoom': 3,
                'maxZoom': 17,
                'mapTypeId': google.maps.MapTypeId.ROADMAP,
                'scrollwheel': true,
                'draggable': true,
                'disableDefaultUI': true,
                'disableDoubleClickZoom': true,
                'draggableCursor': 'default'
            },
            'boundsCollection': new google.maps.LatLngBounds(),
            'boundsActive': null
        };

        this._markers = {
            'data': this.markers,
            'dom': null,
            'custom': [],
            'visible': 0,
            'active': null
        };

        this._story = {
            'article': document.getElementById('story_article'),
            'close': document.getElementById('story_close'),
            'previous': document.getElementById('story_previous'),
            'next': document.getElementById('story_next'),
            'image': document.getElementById('story_image'),
            'share_twitter': document.getElementById('share_twitter'),
            'share_url': document.getElementById('share_url'),
            'title': document.getElementById('story_title'),
            'subTitle': document.getElementById('story_subtitle'),
            'date': document.getElementById('story_date'),
            'position': document.getElementById('story_position'),
            'content': document.getElementById('story_content_inject')
        };

        this.map = new google.maps.Map(this._map.container, this._map.options);
        this.map.setCenter(new google.maps.LatLng(52, 21));
        this.map.setZoom(this._map.options.zoom);

        /**
         * Once the map is loaded, parse input JSON and if valid, create custom markers via Google Maps Overlays.
         */
        this.setMarkers();

    } catch(e) {
        console.warn(e);
    }
};

/**
 * Parse input JSON and create custom markers.
 *
 * @returns {boolean}
 */
Gladstone.prototype.setMarkers = function () {

    function _gcm(continent, latlng, map, args) {
        this.continent = continent;
        this.latlng = latlng;
        this.args = args;
        this.setMap(map);
    }

    _gcm.prototype = new google.maps.OverlayView();

    _gcm.prototype.draw = function () {

        var self = this,
            _m = this.div;

        if ( ! _m) {

            // Marker's wrapper
            _m = this.div = document.createElement('div');
            _m.id = 'marker_' + self.args.marker_id;
            _m.className = 'marker marker_sleep ' + self.args.color + ' noselect';
            _m.dataset.id = self.args.marker_id;
            _m.dataset.previous_id = self.args.marker_previous_id;
            _m.dataset.next_id = self.args.marker_next_id;

            // Pointer
            var _p = document.createElement('span');
            _p.id = 'marker_pointer_' + self.args.marker_id;
            _p.className = 'marker_pointer';

            // Label
            var _l = document.createElement('span');
            _l.id = 'marker_label_' + self.args.marker_id;
            _l.className = 'marker_label';
            _l.innerHTML = self.args.label;

            _m.appendChild(_p);
            _m.appendChild(_l);

            google.maps.event.addDomListener(_m, 'click', function () {
                gladstone.storyOpen(this.getAttribute('data-id'));
            });

            var panes = this.getPanes();
            panes.overlayImage.appendChild(_m);
        }

        var _point = this.getProjection().fromLatLngToDivPixel(this.latlng),
            offsetLeft = 5,
            offsetTop = 20;

        if (_point) {
            _m.style.left = (_point.x - offsetLeft) + 'px';
            _m.style.top = (_point.y - offsetTop) + 'px';
        }
    };

    var self = this,
        _m = self._markers.data,
        _s = self._story,
        _h_cn = document.getElementsByClassName('continent_handler'),
        _h_zm = document.getElementsByClassName('zoom_handler'),
        _hint = document.getElementById('marker_assist'),
        _v = [
            'id',
            'latitude',
            'longitude',
            'continent',
            'zoom',
            'color',
            'image',
            'link',
            'date',
            'position',
            'subTitle',
            'label',
            'description'
        ];

    /**
     * Validate each marker inside input JSON array.
     * Discard an item if at least on of required keys is missing.
     *
     * @todo
     * This is just a very basic validation that doesn't protect from seeing "undefined" when particular value
     * will be empty.
     */
    for (var i = 0; i < _m.length; i++) {
        for (var _k in _m[i]) {
            if (_v.indexOf(_k) === -1) _m.splice(i, 1);
        }
    }

    /**
     * If none of input markers survived the validation, then there's no much things to do. Hide all control icons
     * and exit.
     */
    if ( ! (_m.length > 0)) {

        for (var i = 0; i < _h_cn.length; i++) {
            _h_cn[i].style.display = 'none';
        }

        for (var i = 0; i < _h_zm.length; i++) {
            _h_zm[i].style.display = 'none';
        }

        return false;
    }

    /**
     * Triggered every time "continent_handler" element is clicked.
     *
     * 1) Get the ID attribute to determine destination continent.
     * 2) Grab just those markers, that are assigned to clicked handler.
     * 3) Loop through them to extend map bounds so that all markers within will be visible.
     */
    var listenContinent = function () {

        var _ca = this.getAttribute('id'),
            _m = self.getMarkerByContinent(_ca),
            _ml = _m.length;

        /**
         * There's no point extending bounds of the continent that is active.
         */
        if (_ml > 0 && self._map.boundsActive !== _ca) {

            /**
             * Set clicked handler as active continent and highlight proper icon.
             * @type {string}
             */
            self._map.boundsActive = _ca;
            self.highlightBounds(_ca);

            /**
             * Close story window (if opened)
             */
            self.storyClose();

            /**
             * Finally start extending the bounds.
             *
             * @type {google.maps.LatLngBounds}
             */
            self._map.boundsCollection = new google.maps.LatLngBounds();

            for (var i = 0; i < _ml; i++) {
                self._map.boundsCollection.extend(
                    new google.maps.LatLng(_m[i].latlng.lat(), _m[i].latlng.lng())
                );
            }

            self.map.fitBounds(self._map.boundsCollection);
        }
    };

    /**
     * Triggered every time "zoom_handler" element is clicked.
     *
     * @returns {boolean}
     */
    var listenZoom = function () {

        var _dir = this.getAttribute('id'),
            _z = self.map.getZoom(),
            _s = self._story.article;

        /**
         * Prevent from using zoom when story is opened.
         */
        if (_s.classList.contains('opened')) return false;

        /**
         * Depending on the zoom direction, increase or decrease map zoom by calling "setZoom" with an integer value
         * that is between defined min and max value.
         */
        switch (_dir) {

            case 'map_zoom_in':
                if (_z === self._map.options.maxZoom) return false;
                self.map.setZoom(_z + 1);
                break;

            case 'map_zoom_out':
                if (_z === self._map.options.minZoom) return false;
                self.map.setZoom(_z - 1);
                break;
        }

        /**
         * Once map has been zoomed (in or out) reset active bounds variable so that all continent handlers will be
         * enabled again.
         *
         * @type {null}
         */
        self._map.boundsActive = null;
    };

    /**
     * Loop through each marker and create new Gladstone Custom Marker object.
     * Also push every new object into "_markers.custom" array, so that later it will be easier to reference them.
     */
    for (var i = 0; i < _m.length; i++) {

        var _continent = _m[i].continent,
            _prev = (i === 0) ? _m.length - 1 : i - 1,
            _next = (i === _m.length - 1) ? 0 : i + 1,
            _ll = new google.maps.LatLng(_m[i].latitude, _m[i].longitude),
            _args = {
                'marker_id': _m[i].id,
                'marker_previous_id': _m[_prev].id,
                'marker_next_id': _m[_next].id,
                'color': _m[i].color,
                'image': _m[i].image,
                'link': _m[i].link,
                'date': _m[i].date,
                'position': _m[i].position,
                'subTitle': _m[i].subTitle,
                'label': _m[i].label,
                'zoom': _m[i].zoom,
                'description': _m[i].description
            };

        this._markers.custom.push(
            new _gcm(_continent, _ll, this.map, _args)
        );
    }

    /**
     * Listen to some specific clicks and trigger corresponding method id needed.
     * Below listeners allow you to jump between stories and close the one that is currently opened.
     */
    google.maps.event.addDomListener(_s.previous, 'click', function () {
        self.storyPrevious();
    });

    google.maps.event.addDomListener(_s.next, 'click', function () {
        self.storyNext();
    });

    google.maps.event.addDomListener(_s.close, 'click', function () {

        if (self.options.slugs === true) {
            switch(window.location.protocol) {
                case 'http:':
                case 'https:':
                    window.history.pushState({}, '', self.options.urlMap);
                    break;
            }
        }

        self.storyClose();
    });

    google.maps.event.addDomListener(_s.image, 'click', function (e) {
        var _current = _s.article.getAttribute('data-current');
        if (e.target == this) self.storyRedirect(_current);
    });

    google.maps.event.addDomListener(_s.share_url, 'click', function () {
        var _current = _s.article.getAttribute('data-current');
        self.storyRedirect(_current);
    });

    google.maps.event.addDomListener(_s.share_twitter, 'click', function () {
        var _current = _s.article.getAttribute('data-current');
        self.storyShare(this.getAttribute('id'), _current);
    });

    /**
     * We should always check possible collision detection.
     * Checking is done only when there is more than one marker.
     */
    this.detectMarkersCollisions();

    /**
     * Wake up markers once created.
     */
    this.wakeUpMarkers();

    /**
     * Assign every DOM element with marker created by _gcm to _markers.dom for easier reference.
     *
     * @type {NodeList}
     */
    this._markers.dom = this._map.container.getElementsByClassName('marker');

    /**
     * Add event listeners for continent and zoom handlers.
     * Follow to definition of these functions to learn more what they do.
     */
    for (var i = 0; i < _h_cn.length; i++) {
        _h_cn[i].addEventListener('click', listenContinent, false);
    }

    for (var i = 0; i < _h_zm.length; i++) {
        _h_zm[i].addEventListener('click', listenZoom, false);
    }

    /**
     * Enable Google Maps "idle" event listener.
     * Count all markers that are within visible map area. If 0 returned then show a basic hint for the user
     * for better UX.
     */
    this.map.addListener('idle', (function () {

        this.countVisibleMarkers();

        if (this._markers.visible > 0) {

            _hint.style.display = 'none';

        } else {

            this.highlightBounds(null);
            this._map.boundsActive = null;

            _hint.style.display = 'block';
        }

    }.bind(this)));
};

/**
 * Method animates marker for the first time they are loaded via _gcm object.
 */
Gladstone.prototype.wakeUpMarkers = function () {

    var _l = this.map.addListener('idle', (function () {

            var self = this,
                _m = this._markers.dom,
                _run = function () {

                for (var i = 0; i < _m.length; i++) {
                    setTimeout(function (_marker_wakeup) {
                        _marker_wakeup.classList.remove('marker_sleep');
                    }, Math.floor(Math.random() * 2500), _m[i]);
                }

                if (parseInt(self.options.storyAutoOpen) > 0)
                    self.storyOpen(self.options.storyAutoOpen);

                google.maps.event.removeListener(_l); // You're not a virgin anymore. Kill yourself.
            };

        if (this._markers.dom.length > 0) _run();

    }.bind(this)));
};

/**
 * Get marker by ID
 *
 * @param marker_id
 * @returns {Array.<T>}
 */
Gladstone.prototype.getMarkerById = function (marker_id) {

    var m = this._markers.custom.filter(function (marker) {
        return marker.args.marker_id == marker_id;
    });

    if (m.length === 0) throw this._l('gladstone_exception_marker_not_found');

    return m;
};

/**
 * Get all markers by continent
 *
 * @param continent
 * @returns {*}
 */
Gladstone.prototype.getMarkerByContinent = function (continent) {

    if (continent === 'all_continents') {
        return this._markers.custom;
    }

    return this._markers.custom.filter(function (marker) {
        return marker.continent == continent;
    });
};

/**
 * Function shows or hides markers depending on the collision result.
 * Markers that are in a collision state are disabled and greyed out to not disturb the view.
 */
Gladstone.prototype.detectMarkersCollisions = function () {

    this.map.addListener('idle', (function () {

        var self = this,
            _run = function () {

            var sensitivity = 2,
                markers = [],
                markersDom = self._markers.dom,
                markersDomLength = markersDom.length,
                width = 200 + sensitivity,
                height = 18 + sensitivity,
                x1, y1,
                s1, s2;

            for (var i = 0; i < markersDomLength; i++) {

                var _m_dom = markersDom[i];

                markers.push({
                    marker: _m_dom,
                    garbage: false,
                    x: x1 = Number(_m_dom.offsetLeft),
                    y: y1 = Number(_m_dom.offsetTop),
                    b: y1 + height,
                    r: x1 + width
                });
            }

            for (var i = 0; i < markersDomLength; i++) {

                s1 = markers[i];

                for (var j = i + 1; j < markersDomLength; j++) {

                    // Ignore garbage
                    if ( ! markers[j].garbage) {

                        s2 = markers[j];

                        if (s1.x > s2.r || s1.y > s2.b || s1.r < s2.x || s1.b < s2.y) {
                            s2.marker.classList.remove('collides');
                        } else {
                            s2.garbage = true;
                            s2.marker.classList.add('collides');
                        }
                    }
                }
            }
        };

        /**
         * Just one marker on the map? Easy - no collisions.
         */
        if (this._markers.dom.length >= 2) _run();

    }.bind(this)));
};

/**
 * Method counts how many markers are within existing bounds.
 * Result is assigned to _markers.visible for easier reference later.
 */
Gladstone.prototype.countVisibleMarkers = function () {

    var _b = this.map.getBounds(),
        _m = this._markers.custom,
        _c = 0;

    for (var i = 0; i < _m.length; i++) {
        if (_b.contains(new google.maps.LatLng(_m[i].latlng.lat(), _m[i].latlng.lng()))) _c++;
    }

    this._markers.visible = _c;
};

/**
 * Method highlight proper continent_handler icon and as well as sets _map.boundsActive variable.
 *
 * @param continent_id
 */
Gladstone.prototype.highlightBounds = function (continent_id) {

    var _h_cn = document.getElementsByClassName('continent_handler');

    for (var i = 0; i < _h_cn.length; i++) {
        _h_cn[i].classList.remove('active');
    }

    this._map.boundsActive = continent_id;

    if (continent_id === null) return;

    this._map.boundsActive = continent_id;
    document.getElementById(continent_id).classList.add('active');
};

Gladstone.prototype.storyOpen = function (marker_id) {

    try {

        var m = this.getMarkerById(marker_id);

        this._map.boundsActive = null;
        this.highlightBounds(null);

        if (this._markers.custom.length === 1) {
            this._story.previous.style.display = 'none';
            this._story.next.style.display = 'none';
        }

        var _s = this._story,
            _img = new Image(),
            _show_image_tiles = function () {

                var _rs = document.getElementsByClassName('random_story_tile_image');

                for (var i = 0; i < _rs.length; i++) {
                    setTimeout(function (_show_image_tile) {
                        _show_image_tile.classList.remove('random_story_tile_image_hidden');
                    }, Math.floor(Math.random() * 5000), _rs[i]);
                }
            },
            _shuffle = function (array) {
                for (var i = array.length - 1; i > 0; i--) {
                    var j = Math.floor(Math.random() * (i + 1));
                    var temp = array[i];
                    array[i] = array[j];
                    array[j] = temp;
                }
                return array;
            };

        if (_s.article.classList.contains('opened') === true &&
            _s.article.getAttribute('data-current') == m[0].args.marker_id) return false;

        if (_s.article.getAttribute('data-current') != m[0].args.marker_id) {
            this.storyClose();
        }

        this.map.setOptions({
            'draggable': false,
            'scrollwheel': false
        });
        this.map.panTo(new google.maps.LatLng(m[0].latlng.lat(), m[0].latlng.lng()));
        this.map.setZoom(m[0].args.zoom);
        this.map.panBy(window.innerWidth * -0.25, 0);

        this._markers.active = document.getElementById('marker_' + marker_id);
        this._markers.active.classList.add('active');

        if (this.options.slugs === true) {
            switch(window.location.protocol) {
                case 'http:':
                case 'https:':
                    window.history.pushState({}, m[0].args.subTitle, this.options.urlMap + m[0].args.link + '/');
                    break;
                case 'file:':
                default:
                    console.warn(this._l('gladstone_invalid_protocol_for_slugs'));
                    break;
            }
        }

        _s.article.className = '';
        _s.article.classList.add('opened');
        _s.article.classList.add(m[0].args.color);
        _s.article.setAttribute('data-previous', m[0].args.marker_previous_id);
        _s.article.setAttribute('data-current', m[0].args.marker_id);
        _s.article.setAttribute('data-next', m[0].args.marker_next_id);
        _s.subTitle.innerHTML = m[0].args.subTitle;

        _img.onload = function () {

            var _n_width = _img.naturalWidth,
                _n_height = _img.naturalHeight,
                _d_width = _s.article.offsetWidth,
                _d_height = ((_n_height * _d_width) / _n_width);

            _s.image.style.backgroundImage = 'url(' + m[0].args.image + ')';
            _s.image.style.width = _d_width + 'px';
            _s.image.style.height = _d_height + 'px';
        };

        _img.src = m[0].args.image;

        _s.title.innerHTML = m[0].args.label;
        _s.date.innerHTML = m[0].args.date;
        _s.position.innerHTML = m[0].args.position;
        _s.content.innerHTML = m[0].args.description;

        var _rand = document.getElementById('random'),
            _rand_w = _s.article.offsetWidth,
            _t_dim = _rand_w / 3;

        _rand.style.width = _rand_w + 'px';
        _rand.innerHTML = '';

        if (this._markers.custom.length - 1 > 0) {

            var _rand_see_more = document.createElement('aside');

            _rand_see_more.id = 'random_see_more';
            _rand_see_more.className = 'hand noselect';
            _rand_see_more.innerHTML = this._l('random_see_more');

            _s.content.appendChild(_rand_see_more);
        }

        var _custom_markers_shuffled = _shuffle(this._markers.custom),
            _limit = 6;

        for (var i = 0; i < _custom_markers_shuffled.length; i++) {

            if (i + 1 > _limit) break;

            var _m = _custom_markers_shuffled[i];

            if (_m.args.marker_id == marker_id) continue; // Exclude currently opened marker

            var _ti = document.createElement('div'),
                _ti_inner = document.createElement('div'),
                _ti_locat = document.createElement('h5'),
                _tc = document.createElement('div'),
                _tc_h = document.createElement('h4'),
                _tc_c = document.createElement('div');

            _ti.setAttribute('data-dest-id', _m.args.marker_id);
            _ti.className = 'random_story random_story_tile_image_hidden random_story_tile_image';
            _ti.style.width = _t_dim + 'px';
            _ti.style.height = _t_dim + 'px';

            _ti_inner.style.backgroundImage = 'url(' + _m.args.image + ')';
            _ti.appendChild(_ti_inner);

            _ti_locat.className = 'location';
            _ti_locat.innerHTML = _m.args.label;
            _ti_inner.appendChild(_ti_locat);

            _tc.setAttribute('data-dest-id', _m.args.marker_id);
            _tc.className = 'random_story random_story_tile_content ' + _m.args.color;
            _tc.style.width = _t_dim + 'px';
            _tc.style.height = _t_dim + 'px';

            _tc_h.className = 'title';
            _tc_h.innerHTML = _m.args.label;
            _tc.appendChild(_tc_h);

            _tc_c.className = 'content';
            _tc_c.innerHTML = _m.args.description.substring(0, 100) + '…';
            _tc.appendChild(_tc_c);

            _rand.appendChild(_ti);
            _rand.appendChild(_tc);

            var self = this;

            _ti.addEventListener('click', function() {
                self.storyOpen(this.getAttribute('data-dest-id'));
            }, false);

            _tc.addEventListener('click', function() {
                self.storyOpen(this.getAttribute('data-dest-id'));
            }, false);
        }

        _s.article.scrollTop = 0;
        _show_image_tiles();
    }
    catch(e) {
        console.log(e);
    }
};

Gladstone.prototype.storyClose = function () {

    var _s = this._story,
        _rand = document.getElementById('random');

    _rand.innerHTML = '';
    _s.article.className = '';
    _s.article.setAttribute('data-previous', '');
    _s.article.setAttribute('data-current', '');
    _s.article.setAttribute('data-next', '');
    _s.subTitle.innerHTML = '';
    _s.image.setAttribute('data-id', '');
    _s.image.style.backgroundImage = '';
    _s.image.style.width = '';
    _s.image.style.height = '';
    _s.title.innerHTML = '';
    _s.date.innerHTML = '';
    _s.position.innerHTML = '';
    _s.content.innerHTML = '';

    if (this._markers.active !== null) {
        this._markers.active.classList.remove('active');
        this._markers.active = null;
    }

    this.map.panBy(window.innerWidth * 0.25, 0);
    this.map.setOptions({
        'draggable': this._map.options.draggable,
        'scrollwheel': this._map.options.scrollwheel
    });
};

Gladstone.prototype.storyPrevious = function () {

    var _dest = this._story.article.getAttribute('data-previous');
    this.storyOpen(_dest);
};

Gladstone.prototype.storyNext = function () {

    var _dest = this._story.article.getAttribute('data-next');
    this.storyOpen(_dest);
};

Gladstone.prototype.storyRedirect = function (marker_id) {

    var _m = this.getMarkerById(marker_id);
    window.open(this.options.urlRoot + _m[0].args.link, '_blank');
};

Gladstone.prototype.storyShare = function (type, marker_id) {

    var _m = this.getMarkerById(marker_id);

    switch(type) {
        case 'share_twitter':

            var label = _m[0].args.label,
                subTitle = _m[0].args.subTitle,
                link = (this.options.slugs === true ? this.options.urlMap + _m[0].args.link : _m[0].args.link),
                url = 'http://twitter.com/share?text=' + label + ' - ' + subTitle + '…&url=' + link; // Support hashtags

            window.open(url, this._l('share_container_twitter_popup_title'), 'width=600, height=240, scrollbars=no');
            break;
    }
};

Gladstone.prototype.setMarkup = function () {

    /**
     * Definitions
     *
     * @type {Element}
     * @private
     */
    var _tpl_wrapper = document.createElement('div'),
        _tpl_map_controls = document.createElement('aside'),
        _tpl_map_controls_all_continents = document.createElement('nav'),
        _tpl_map_controls_map_zoom_in = document.createElement('nav'),
        _tpl_map_controls_map_zoom_out = document.createElement('nav'),
        _tpl_marker_assist = document.createElement('aside'),
        _tpl_marker_assist_arrow = document.createElement('p'),
        _tpl_marker_assist_hand = document.createElement('p'),
        _tpl_map_controls_continents = document.createElement('aside'),
        _tpl_continent_europe = document.createElement('nav'),
        _tpl_continent_australia = document.createElement('nav'),
        _tpl_continent_new_zealand = document.createElement('nav'),
        _tpl_story_article = document.createElement('article'),
        _tpl_story_header = document.createElement('header'),
        _tpl_story_close = document.createElement('nav'),
        _tpl_story_previous = document.createElement('nav'),
        _tpl_story_next = document.createElement('nav'),
        _tpl_story_main = document.createElement('main'),
        _tpl_story_image = document.createElement('figure'),
        _tpl_story_share_container = document.createElement('nav'),
        _tpl_story_share_container_wrapper = document.createElement('div'),
        _tpl_story_share_container_twitter = document.createElement('nav'),
        _tpl_story_share_container_url = document.createElement('nav'),
        _tpl_story_title = document.createElement('h1'),
        _tpl_story_subtitle = document.createElement('div'),
        _tpl_story_date = document.createElement('div'),
        _tpl_story_position = document.createElement('div'),
        _tpl_story_content_inject = document.createElement('div'),
        _tpl_random = document.createElement('div');

    /**
     * Setters
     *
     * @type {string}
     */
    _tpl_wrapper.id = 'gladstone_wrapper';

    _tpl_map_controls.id = 'map_controls';
    _tpl_map_controls.className = 'map_controls_group';
    _tpl_map_controls_all_continents.id = 'all_continents';
    _tpl_map_controls_all_continents.className = 'continent_handler continent_part';
    _tpl_map_controls_all_continents.setAttribute('title', this._l('all_continents'));
    _tpl_map_controls_map_zoom_in.id = 'map_zoom_in';
    _tpl_map_controls_map_zoom_in.className = 'zoom_handler';
    _tpl_map_controls_map_zoom_in.setAttribute('title', this._l('map_zoom_in'));
    _tpl_map_controls_map_zoom_out.id = 'map_zoom_out';
    _tpl_map_controls_map_zoom_out.className = 'zoom_handler';
    _tpl_map_controls_map_zoom_out.setAttribute('title', this._l('map_zoom_out'));

    _tpl_marker_assist.id = 'marker_assist';
    _tpl_marker_assist.className = 'noselect';
    _tpl_marker_assist_arrow.id = 'arrow';
    _tpl_marker_assist_hand.className = 'hand';
    _tpl_marker_assist_hand.innerHTML = this._l('marker_assist');

    _tpl_map_controls_continents.id = 'map_continents_controls';
    _tpl_map_controls_continents.className = 'map_controls_group noselect';
    _tpl_continent_europe.id = 'europe';
    _tpl_continent_europe.className = 'continent_handler continent_part';
    _tpl_continent_australia.id = 'australia';
    _tpl_continent_australia.className = 'continent_handler continent_part';
    _tpl_continent_new_zealand.id = 'new_zealand';
    _tpl_continent_new_zealand.className = 'continent_handler continent_part';

    _tpl_story_article.id = 'story_article';
    _tpl_story_header.id = 'story_header';
    _tpl_story_header.className = 'noselect';
    _tpl_story_close.id = 'story_close';
    _tpl_story_close.setAttribute('title', this._l('story_close'));
    _tpl_story_previous.id = 'story_previous';
    _tpl_story_previous.setAttribute('title', this._l('story_previous'));
    _tpl_story_next.id = 'story_next';
    _tpl_story_next.setAttribute('title', this._l('story_next'));
    _tpl_story_main.id = 'story_main';
    _tpl_story_image.id = 'story_image';
    _tpl_story_share_container.id = 'story_share_container';
    _tpl_story_share_container.setAttribute('title', this._l('share_container'));
    _tpl_story_share_container_wrapper.id = 'story_share_container_wrapper';
    _tpl_story_share_container_twitter.id = 'share_twitter';
    _tpl_story_share_container_twitter.setAttribute('title', this._l('share_container_twitter'));
    _tpl_story_share_container_url.id = 'share_url';
    _tpl_story_share_container_url.setAttribute('title', this._l('share_container_url'));
    _tpl_story_title.id = 'story_title';
    _tpl_story_title.className = 'noselect';
    _tpl_story_subtitle.id = 'story_subtitle';
    _tpl_story_subtitle.className = 'noselect';
    _tpl_story_date.id = 'story_date';
    _tpl_story_date.className = 'noselect';
    _tpl_story_position.id = 'story_position';
    _tpl_story_position.className = 'noselect';
    _tpl_story_content_inject.id = 'story_content_inject';
    _tpl_story_content_inject.className = 'noselect';
    _tpl_random.id = 'random';
    _tpl_random.className = 'noselect';

    /**
     * Builders
     */
    document.body.appendChild(_tpl_wrapper);

    _tpl_wrapper.appendChild(_tpl_map_controls);
    _tpl_wrapper.appendChild(_tpl_marker_assist);
    _tpl_wrapper.appendChild(_tpl_map_controls_continents);
    _tpl_wrapper.appendChild(_tpl_story_article);

    _tpl_marker_assist.appendChild(_tpl_marker_assist_arrow);
    _tpl_marker_assist.appendChild(_tpl_marker_assist_hand);

    _tpl_map_controls.appendChild(_tpl_map_controls_all_continents);
    _tpl_map_controls.appendChild(_tpl_map_controls_map_zoom_in);
    _tpl_map_controls.appendChild(_tpl_map_controls_map_zoom_out);

    _tpl_map_controls_continents.appendChild(_tpl_continent_europe);
    _tpl_map_controls_continents.appendChild(_tpl_continent_australia);
    _tpl_map_controls_continents.appendChild(_tpl_continent_new_zealand);

    _tpl_story_article.appendChild(_tpl_story_header);
    _tpl_story_article.appendChild(_tpl_story_main);
    _tpl_story_article.appendChild(_tpl_random);

    _tpl_story_header.appendChild(_tpl_story_close);
    _tpl_story_header.appendChild(_tpl_story_previous);
    _tpl_story_header.appendChild(_tpl_story_next);
    _tpl_story_header.appendChild(_tpl_story_subtitle);

    _tpl_story_main.appendChild(_tpl_story_image);
    _tpl_story_main.appendChild(_tpl_story_title);
    _tpl_story_main.appendChild(_tpl_story_date);
    _tpl_story_main.appendChild(_tpl_story_position);
    _tpl_story_main.appendChild(_tpl_story_content_inject);

    _tpl_story_share_container.appendChild(_tpl_story_share_container_wrapper);
    _tpl_story_share_container_wrapper.appendChild(_tpl_story_share_container_url);
    _tpl_story_share_container_wrapper.appendChild(_tpl_story_share_container_twitter);

    _tpl_story_image.appendChild(_tpl_story_share_container);
};

Gladstone.prototype._l = function(key) {

    var data = {

        'en': {
            'gladstone_invalid_protocol_for_slugs': 'I see that "slugs" option is enabled. Unfortunately dynamic change of the URL address cannot work when you are using file:// protocol. Run Gladstone via http(s).',
            'gladstone_exception_marker_not_found': 'Requested marker does not exist',
            'all_continents': 'Show all continents',
            'map_zoom_in': 'Click to zoom in',
            'map_zoom_out': 'Click to zoom out',
            'marker_assist': 'Did you get lost? Click here!',
            'story_close': 'Close story',
            'story_previous': 'Previous story',
            'story_next': 'Next story',
            'share_container': 'See how you can share this article',
            'share_container_url': 'Share the URL',
            'share_container_twitter': 'Tweet about it',
            'share_container_twitter_popup_title': 'Share it with your friends!',
            'random_see_more': 'Do you have some spare time? See more places below! :)'
        },

        'pl': {
            'gladstone_invalid_protocol_for_slugs': 'Widzę, że opcja "slugs" jest włączona. Niestety dynamiczna zmiana adresu URL w przeglądarce nie może działać kiedy używasz protokołu file://. Uruchom Gladstone poprzez http(s).',
            'gladstone_exception_marker_not_found': 'Żądany marker nie istnieje',
            'all_continents': 'Pokaż wszystkie kontynenty',
            'map_zoom_in': 'Kliknij aby przybliżyć',
            'map_zoom_out': 'Kliknij aby oddalić',
            'marker_assist': 'Nie wiesz dokąd teraz? Kliknij tutaj!',
            'story_close': 'Zamknij artykuł',
            'story_previous': 'Poprzedni artykuł',
            'story_next': 'Następny artykuł',
            'share_container': 'Zobacz jak możesz udostępnić ten artykuł',
            'share_container_url': 'Udostępnij odnośnik do tej strony',
            'share_container_twitter': 'Tweetnij o tym',
            'share_container_twitter_popup_title': 'Podziel się tym ze swoimi przyjaciółmi!',
            'random_see_more': 'Masz jeszcze chwilę czasu? Zobacz poniższe miejsca! :)'
        }
    };

    /**
     * Validate the language variable and set fallback language if the given is invalid
     *
     * @type {string}
     */
    this.options.lang = (Object.keys(data).indexOf(this.options.lang) > 0) ? this.options.lang : 'en';

    return data[this.options.lang][key];
};
