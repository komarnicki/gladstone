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
 * @constructor
 */
function Gladstone(key, canvas, markers) {

    try {

        this.key = key;
        this.canvas = canvas;
        this.markers = markers;

        var self = this;

        /**
         * Load Google Maps API asynchronously to keep index file as clean as possible.
         * Once API is loaded, trigger the callback function that's within window scope.
         *
         * @private
         */
        window.onload = function _() {
            var _s = document.createElement('script');
            _s.src = 'https://maps.googleapis.com/maps/api/js?key=' + self.key + '&sensor=false&callback=_c';
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
            'container': document.getElementById('story'),
            'close': document.getElementById('story_close'),
            'previous': document.getElementById('story_previous'),
            'next': document.getElementById('story_next'),
            'header': document.getElementById('story_header'),
            'image': document.getElementById('story_image'),
            'title': document.getElementById('story_title'),
            'date': document.getElementById('story_date'),
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
        console.log(e);
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

        var self = this;
        var div = this.div;

        if ( ! div) {

            // Marker's wrapper
            div = this.div = document.createElement('div');
            div.id = 'marker_' + self.args.marker_id;
            div.className = 'noselect marker ' + self.args.color;
            div.dataset.id = self.args.marker_id;
            div.dataset.previous_id = self.args.marker_previous_id;
            div.dataset.next_id = self.args.marker_next_id;

            // Pointer
            var pointer = document.createElement('span');
            pointer.id = 'marker_pointer_' + self.args.marker_id;
            pointer.className = 'noselect marker_pointer marker_icon ' + self.args.color;

            // Label
            var label = document.createElement('span');
            label.id = 'marker_label_' + self.args.marker_id;
            label.className = 'noselect marker_label';
            label.innerHTML = self.args.label;

            div.appendChild(pointer);
            div.appendChild(label);

            google.maps.event.addDomListener(div, 'click', function () {
                gladstone.storyOpen(this.getAttribute('data-id'));
            });

            var panes = this.getPanes();
            panes.overlayImage.appendChild(div);
        }

        var point = this.getProjection().fromLatLngToDivPixel(this.latlng),
            offsetLeft = 5,
            offsetTop = 20;

        if (point) {
            div.style.left = (point.x - offsetLeft) + 'px';
            div.style.top = (point.y - offsetTop) + 'px';
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
            'date',
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
            _m = self.filterMarkers(_ca),
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
            self.highlighBounds(_ca);

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
            _z = self.map.getZoom();

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
                'date': _m[i].date,
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
        self.storyClose();
    });

    /**
     * Home alone can't collide but if we have more than one marker on the map, we should turn on collision detection.
     * Follow to this method's definition to learn more what it does.
     */
    if (this._markers.custom.length >= 2) this.detectMarkersCollisions();

    /**
     * Assign every DOM element with marker created by _gcm to _markers.dom for easier refference.
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

            this.highlighBounds(null);
            this._map.boundsActive = null;

            _hint.style.display = 'block';
        }

    }.bind(this)));
};

/**
 * Narrow down markers array by continent attribute.
 * Method returns those markers which continent attribute matches the string passed as an argument.
 *
 * @param continent
 * @returns {*}
 */
Gladstone.prototype.filterMarkers = function (continent) {

    if (continent === 'all_continents') {
        return this._markers.custom;
    }

    return this._markers.custom.filter(function (marker) {
        return marker.continent === continent;
    });
};

/**
 * Function shows or hides markers depending on the collision result.
 * Markers that are in a collision state are disabled and greyed out to not disturb the view.
 */
Gladstone.prototype.detectMarkersCollisions = function () {

    this.map.addListener('idle', (function () {

        var self = this;

        var _run = function () {

            var sensitivity = 2;
            var markers = [];
            var markersDom = self._markers.dom;
            var markersDomLength = markersDom.length;
            var width = 200 + sensitivity;
            var height = 18 + sensitivity;
            var x1, y1;
            var s1, s2;

            for (var i = 0; i < markersDomLength; i++) {

                var div = markersDom[i];

                markers.push({
                    square: div,
                    garbage: false,
                    x: x1 = Number(div.offsetLeft),
                    y: y1 = Number(div.offsetTop),
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
                            s2.square.classList.remove('collides');
                        } else {
                            s2.garbage = true;
                            s2.square.classList.add('collides');
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

    var bounds = this.map.getBounds();
    var m = this._markers.custom;
    var c = 0;

    for (var i = 0; i < m.length; i++) {
        if (bounds.contains(new google.maps.LatLng(m[i].latlng.lat(), m[i].latlng.lng()))) c++;
    }

    this._markers.visible = c;
};

/**
 * Method highlight proper continent_handler icon and as well as sets _map.boundsActive variable.
 *
 * @param continent_id
 */
Gladstone.prototype.highlighBounds = function (continent_id) {

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

    this._map.boundsActive = null;

    if (this._markers.custom.length === 1) {
        this._story.previous.style.display = 'none';
        this._story.next.style.display = 'none';
    }

    var _s = this._story,
        _img = new Image(),
        m = this._markers.custom.filter(function (marker) {
        return marker.args.marker_id == marker_id;
    });

    if (_s.container.classList.contains('opened') === true &&
        _s.container.getAttribute('data-current') == m[0].args.marker_id) return false;

    if (_s.container.getAttribute('data-current') != m[0].args.marker_id) {
        this.storyClose();
    }

    this.map.setOptions({
        'draggable': false
    });
    this.map.panTo(new google.maps.LatLng(m[0].latlng.lat(), m[0].latlng.lng()));
    this.map.setZoom(m[0].args.zoom);
    this.map.panBy(window.innerWidth * -0.25, 0);

    this._markers.active = document.getElementById('marker_' + marker_id);
    this._markers.active.classList.add('active');

    _s.container.className = '';
    _s.container.classList.add('opened');
    _s.container.classList.add(m[0].args.color);
    _s.container.setAttribute('data-previous', m[0].args.marker_previous_id);
    _s.container.setAttribute('data-current', m[0].args.marker_id);
    _s.container.setAttribute('data-next', m[0].args.marker_next_id);
    _s.header.innerHTML = m[0].args.label;

    _img.onload = function () {

        var _sw = _s.image.clientWidth;
        var _h = Math.floor((_sw * _img.height) / _img.width);

        _s.image.style.backgroundImage = 'url(' + m[0].args.image + ')';
        _s.image.style.height = _h + 'px';
    };

    _img.src = m[0].args.image;

    _s.title.innerHTML = m[0].args.label;
    _s.date.innerHTML = m[0].args.date;
    _s.content.innerHTML = m[0].args.description;

    var _rand = document.getElementById('random'),
        _rand_w = _s.container.offsetWidth,
        _t_dim = _rand_w / 3;

    _rand.style.width = _rand_w + 'px';
    _rand.innerHTML = '';

    for (var i = 0; i < this._markers.custom.length; i++) {

        var _rand_m_id = i + 1,
            _m = this._markers.custom[i],
            _ti = document.createElement('div'),
            _ti_inner = document.createElement('div'),
            _ti_locat = document.createElement('h5'),
            _tc = document.createElement('div'),
            _tc_h = document.createElement('h4'),
            _tc_c = document.createElement('div');

        if (_rand_m_id == marker_id) continue; // Exclude currently opened marker

        _ti.setAttribute('data-dest-id', _rand_m_id);
        _ti.className = 'random_story random_story_tile_image';
        _ti.style.width = _t_dim + 'px';
        _ti.style.height = _t_dim + 'px';

        _ti_inner.style.backgroundImage = 'url(' + _m.args.image + ')';
        _ti.appendChild(_ti_inner);

        _ti_locat.className = 'location';
        _ti_locat.innerHTML = _m.args.label;
        _ti_inner.appendChild(_ti_locat);

        _tc.setAttribute('data-dest-id', _rand_m_id);
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

    _s.container.scrollTop = 0;
};

Gladstone.prototype.storyClose = function () {

    var _s = this._story,
        _rand = document.getElementById('random');

    _rand.innerHTML = '';

    _s.container.className = '';
    _s.container.setAttribute('data-previous', '');
    _s.container.setAttribute('data-current', '');
    _s.container.setAttribute('data-next', '');
    _s.header.innerHTML = '';
    _s.image.style.backgroundImage = '';
    _s.image.style.height = '';
    _s.title.innerHTML = '';
    _s.date.innerHTML = '';
    _s.content.innerHTML = '';

    if (this._markers.active !== null) {
        this._markers.active.classList.remove('active');
        this._markers.active = null;
    }

    this.map.panBy(window.innerWidth * 0.25, 0);
    this.map.setOptions({
        'draggable': this._map.options.draggable
    });
};

Gladstone.prototype.storyPrevious = function () {

    var _dest = this._story.container.getAttribute('data-previous');
    this.storyOpen(_dest);
};

Gladstone.prototype.storyNext = function () {

    var _dest = this._story.container.getAttribute('data-next');
    this.storyOpen(_dest);
};

Gladstone.prototype.setMarkup = function () {

    var _tpl_map_controls = document.createElement('aside'),
        _tpl_map_controls_all_continents = document.createElement('nav'),
        _tpl_map_controls_map_zoom_in = document.createElement('nav'),
        _tpl_map_controls_map_zoom_out = document.createElement('nav'),
        _tpl_marker_assist = document.createElement('aside'),
        _tpl_map_continents_controls = document.createElement('aside'),
        _tpl_continent_europe = document.createElement('nav'),
        _tpl_continent_australia = document.createElement('nav'),
        _tpl_continent_new_zealand = document.createElement('nav'),
        _tpl_story_wrapper = document.createElement('div'),
        _tpl_story = document.createElement('article'),
        _tpl_story_header_wrapper = document.createElement('header'),
        _tpl_story_close = document.createElement('nav'),
        _tpl_story_previous = document.createElement('nav'),
        _tpl_story_next = document.createElement('nav'),
        _tpl_story_header = document.createElement('div'),
        _tpl_story_content_wrapper = document.createElement('div'),
        _tpl_story_image = document.createElement('div'),
        _tpl_story_content = document.createElement('div'),
        _tpl_story_title = document.createElement('h1'),
        _tpl_story_date = document.createElement('div'),
        _tpl_story_position = document.createElement('div'),
        _tpl_story_content_inject = document.createElement('div'),
        _tpl_random = document.createElement('div');

    _tpl_map_controls.setAttribute('id', 'map_controls');
    _tpl_map_controls.className = 'map_controls_group noselect';

    _tpl_map_controls_all_continents.setAttribute('id', 'all_continents');
    _tpl_map_controls_all_continents.className = 'continent_handler continent_part';
    _tpl_map_controls_map_zoom_in.setAttribute('id', 'map_zoom_in');
    _tpl_map_controls_map_zoom_out.setAttribute('id', 'map_zoom_out');

    _tpl_map_controls.appendChild(_tpl_map_controls_all_continents);
    _tpl_map_controls.appendChild(_tpl_map_controls_map_zoom_in);
    _tpl_map_controls.appendChild(_tpl_map_controls_map_zoom_out);

    _tpl_marker_assist.setAttribute('id', 'marker_assist');
    _tpl_marker_assist.className = 'noselect';
    _tpl_marker_assist.innerHTML = '<p id="arrow"></p><p class="hand">Did you get lost? Click here!</p>';

    _tpl_map_continents_controls.setAttribute('id', 'map_continents_controls');
    _tpl_map_continents_controls.className = 'map_controls_group noselect';

    _tpl_continent_europe.setAttribute('id', 'europe');
    _tpl_continent_europe.className = 'continent_handler continent_part';

    _tpl_continent_australia.setAttribute('id', 'australia');
    _tpl_continent_australia.className = 'continent_handler continent_part';

    _tpl_continent_new_zealand.setAttribute('id', 'new_zealand');
    _tpl_continent_new_zealand.className = 'continent_handler continent_part';

    _tpl_map_continents_controls.appendChild(_tpl_continent_europe);
    _tpl_map_continents_controls.appendChild(_tpl_continent_australia);
    _tpl_map_continents_controls.appendChild(_tpl_continent_new_zealand);

    _tpl_story_wrapper.setAttribute('id', 'story_wrapper');
    _tpl_story.setAttribute('id', 'story');
    _tpl_story_header_wrapper.className = 'noselect';

    _tpl_story_close.setAttribute('id', 'story_close');
    _tpl_story_previous.setAttribute('id', 'story_previous');
    _tpl_story_next.setAttribute('id', 'story_next');
    _tpl_story_header.setAttribute('id', 'story_header');

    _tpl_story_wrapper.appendChild(_tpl_story);
    _tpl_story.appendChild(_tpl_story_header_wrapper);

    _tpl_story_header_wrapper.appendChild(_tpl_story_close);
    _tpl_story_header_wrapper.appendChild(_tpl_story_previous);
    _tpl_story_header_wrapper.appendChild(_tpl_story_next);
    _tpl_story_header_wrapper.appendChild(_tpl_story_header);

    _tpl_story_content_wrapper.setAttribute('id', 'content');
    _tpl_story_content_wrapper.className = 'noselect';
    _tpl_story.appendChild(_tpl_story_content_wrapper);

    _tpl_story_image.setAttribute('id', 'story_image');
    _tpl_story_content_wrapper.appendChild(_tpl_story_image);

    _tpl_story_content.setAttribute('id', 'story_content');
    _tpl_story_content_wrapper.appendChild(_tpl_story_content);

    _tpl_story_title.setAttribute('id', 'story_title');
    _tpl_story_content.appendChild(_tpl_story_title);

    _tpl_story_date.setAttribute('id', 'story_date');
    _tpl_story_content.appendChild(_tpl_story_date);

    _tpl_story_position.setAttribute('id', 'story_position');
    _tpl_story_content.appendChild(_tpl_story_position);

    _tpl_story_content_inject.setAttribute('id', 'story_content_inject');
    _tpl_story_content.appendChild(_tpl_story_content_inject);

    _tpl_random.setAttribute('id', 'random');
    _tpl_story_content_wrapper.appendChild(_tpl_random);

    document.body.appendChild(_tpl_map_controls);
    document.body.appendChild(_tpl_marker_assist);
    document.body.appendChild(_tpl_map_continents_controls);
    document.body.appendChild(_tpl_story_wrapper);
};
