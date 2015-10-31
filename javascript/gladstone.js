function Gladstone(selector, markers) {

    try {

        this.args = {
            map_element: document.getElementById(selector),
            map_bound_active: null,
            map_bounds: new google.maps.LatLngBounds(),
            map_markers: markers,
            map_markers_dom: null,
            map_markers_custom: [],
            map_markers_count_visible: 0,
            map_position_default: new google.maps.LatLng(-27.480515, 153.066031), // Brisbane
            map_options: {
                styles: [ { featureType: 'administrative', elementType: 'all', stylers: [ { visibility: 'off' } ] }, { featureType: 'landscape', elementType: 'all', stylers: [ {hue: '#FFFFFF'}, {saturation: -100}, {lightness: 100}, {visibility: 'on'} ] }, { featureType: 'poi', elementType: 'all', stylers: [ {visibility: 'off'} ] }, { featureType: 'road', elementType: 'all', stylers: [ {visibility: 'on'}, {lightness: -30} ] }, { featureType: 'road', elementType: 'labels', stylers: [ {visibility: 'off'} ] }, { featureType: 'transit', elementType: 'all', stylers: [ {visibility: 'off'} ] }, { featureType: 'water', elementType: 'all', stylers: [ {saturation: -100}, {lightness: -100} ] }, { featureType: 'landscape', elementType: 'labels.text', stylers: [ {visibility: 'off'} ] }, { featureType: 'all', elementType: 'all', stylers: [ {saturation: -100}, {lightness: 91} ] } ],
                zoom: 5,
                minZoom: 3,
                maxZoom: 17,
                mapTypeId: google.maps.MapTypeId.ROADMAP,
                scrollwheel: true,
                draggable: true,
                disableDefaultUI: true,
                disableDoubleClickZoom: true,
                draggableCursor: 'default'
            },
            marker_active: null,
            el_story: document.getElementById('story'),
            el_story_close: document.getElementById('story_close'),
            el_story_previous: document.getElementById('story_previous'),
            el_story_next: document.getElementById('story_next'),
            el_story_header: document.getElementById('story_header'),
            el_story_image: document.getElementById('story_image'),
            el_story_title: document.getElementById('story_title'),
            el_story_content: document.getElementById('story_content_inject')
        };

        this.map = new google.maps.Map(this.args.map_element, this.args.map_options);
        this.map.setCenter(this.args.map_position_default);
        this.map.setZoom(this.args.map_options.zoom);

        this.setMarkers();

    } catch(e) {
        console.log('WARNING! Gladstone Exception!');
        console.log('Message: ' + e);
    }
}

Gladstone.prototype.setMarkers = function () {

    var _im = this.args.map_markers;
    var ch = document.getElementsByClassName('continent_handler');
    var zh = document.getElementsByClassName('zoom_handler');
    var valid_keys = ['id', 'latitude', 'longitude', 'continent', 'zoom', 'color', 'image', 'label', 'description'];

    // Validate input
    for (var i = 0; i < _im.length; i++) {
        for (var _k in _im[i]) {
            // Remove the marker entirely from input array before passing to CustomMarker object
            if (valid_keys.indexOf(_k) === -1) _im.splice(i, 1);
        }
    }

    // If no markers, then hide unnecessary icons, set minimum zoom on the map and say Goodbye!
    if (_im.length === 0) {

        for (var i = 0; i < ch.length; i++) {
            ch[i].style.display = 'none';
        }

        for (var i = 0; i < zh.length; i++) {
            zh[i].style.display = 'none';
        }

        this.map.setZoom(this.args.map_options.minZoom);

        return false;
    }

    var self = this;

    var listenContinent = function () {

        var ca = this.getAttribute('id');
        var fm = self.filterMarkers(ca);
        var _fml = fm.length; // Filtered markers / length

        // No point in switching bounds to continent that has no markers or is already active
        if (_fml > 0 && self.args.map_bound_active !== ca) {

            self.args.map_bound_active = ca;

            self.storyClose();

            for (var i = 0; i < ch.length; i++) {
                ch[i].classList.remove('active');
            }

            // Highlight current continent handler icon
            this.classList.add('active');

            // Extend bounds so that all markers from selected continent will be visible
            self.args.map_bounds = new google.maps.LatLngBounds();

            for (var i = 0; i < _fml; i++) {
                self.args.map_bounds.extend(new google.maps.LatLng(fm[i].latlng.lat(), fm[i].latlng.lng()));
            }

            self.map.fitBounds(self.args.map_bounds);

            if (_fml === 1) self.map.setZoom(fm[0].args.zoom);
        }
    };

    var listenZoom = function () {

        var cz = self.map.getZoom();
        var dir = this.getAttribute('id');

        switch (dir) {

            case 'map_zoom_in':
                if (cz == self.args.map_options.maxZoom) return false;
                self.map.setZoom(cz + 1);
                break;

            case 'map_zoom_out':
                if (cz == self.args.map_options.minZoom) return false;
                self.map.setZoom(cz - 1);
                break;
        }

        self.args.map_bound_active = null;
    };

    self.args.map_bounds = new google.maps.LatLngBounds();

    // Create custom markers from validated input
    for (var i = 0; i < _im.length; i++) {

        var _prev = (i === 0) ? _im.length - 1 : i - 1;
        var _next = (i === _im.length - 1) ? 0 : i + 1;
        var _ll = new google.maps.LatLng(_im[i].latitude, _im[i].longitude);

        this.args.map_markers_custom.push(
            new CustomMarker(
                _im[i].continent,
                _ll,
                this.map,
                {
                    marker_id: _im[i].id,
                    marker_previous_id: _im[_prev].id,
                    marker_next_id: _im[_next].id,
                    color: _im[i].color,
                    image: _im[i].image,
                    label: _im[i].label,
                    zoom: _im[i].zoom,
                    description: _im[i].description
                }
            )
        );

        self.args.map_bounds.extend(_ll);
    }

    self.map.fitBounds(self.args.map_bounds);
    self.args.map_bound_active = 'map_restore';

    google.maps.event.addDomListener(this.args.el_story_close, 'click', function () {
        self.storyClose();
    });

    google.maps.event.addDomListener(this.args.el_story_previous, 'click', function () {
        self.storyPrevious();
    });

    google.maps.event.addDomListener(this.args.el_story_next, 'click', function () {
        self.storyNext();
    });

    // Enable collision detection if there are at least two markers
    if (this.args.map_markers_custom.length >= 2) this.detectMarkersCollisions();

    this.args.map_markers_dom = this.args.map_element.getElementsByClassName('marker');

    // Listen for continent change
    for (var i = 0; i < ch.length; i++) {
        ch[i].addEventListener('click', listenContinent, false);
    }

    // Lister for zoom change
    for (var i = 0; i < zh.length; i++) {
        zh[i].addEventListener('click', listenZoom, false);
    }

    this.map.addListener('idle', (function () {
        this.countVisibleMarkers();
        this.assistWithMarkers();
    }.bind(this)));
};

Gladstone.prototype.filterMarkers = function (continent) {

    if (continent == 'map_restore') {
        return this.args.map_markers_custom;
    }

    return this.args.map_markers_custom.filter(function (marker) {
        return marker.continent == continent;
    });
};

Gladstone.prototype.detectMarkersCollisions = function () {

    this.map.addListener('idle', (function () {

        var self = this;
        var run = function () {

            var sensitivity = 2;
            var markers = [];
            var markers_dom = self.args.map_markers_dom;
            var markers_dom_count = markers_dom.length;
            var width = 200 + sensitivity;
            var height = 18 + sensitivity;
            var x1, y1;
            var s1, s2;

            for (var i = 0; i < markers_dom_count; i++) {

                var div = markers_dom[i];

                markers.push({
                    square: div,
                    garbage: false,
                    x: x1 = Number(div.offsetLeft),
                    y: y1 = Number(div.offsetTop),
                    b: y1 + height,
                    r: x1 + width
                });
            }

            for (var i = 0; i < markers_dom_count; i++) {

                s1 = markers[i];

                for (var j = i + 1; j < markers_dom_count; j++) {

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

        if (this.args.map_markers_dom.length > 1) run();

    }.bind(this)));
};

Gladstone.prototype.countVisibleMarkers = function () {

    var bounds = this.map.getBounds();
    var m = this.args.map_markers_custom;
    var c = 0;

    for (var i = 0; i < m.length; i++) {
        if (bounds.contains(new google.maps.LatLng(m[i].latlng.lat(), m[i].latlng.lng()))) c++;
    }

    this.args.map_markers_count_visible = c;
};

Gladstone.prototype.assistWithMarkers = function () {

    var hint = document.getElementById('marker_assist');

    if (this.args.map_markers_count_visible === 0) {

        var ch = document.getElementsByClassName('continent_handler');

        for (var i = 0; i < ch.length; i++) {
            ch[i].classList.remove('active');
        }

        hint.style.display = 'block';
    } else {
        hint.style.display = 'none';
    }
};

Gladstone.prototype.storyOpen = function (marker_id) {

    var m = this.args.map_markers_custom.filter(function (marker) {
        return marker.args.marker_id == marker_id;
    });

    if (this.args.el_story.classList.contains('opened') === true &&
        this.args.el_story.getAttribute('data-current') == m[0].args.marker_id) return false;

    if (this.args.el_story.getAttribute('data-current') != m[0].args.marker_id) {
        this.storyClose();
    }

    this.map.setOptions({
        draggable: false
    });
    this.map.panTo(new google.maps.LatLng(m[0].latlng.lat(), m[0].latlng.lng()));
    this.map.setZoom(m[0].args.zoom);
    this.map.panBy(window.innerWidth * -0.25, 0);

    this.args.marker_active = document.getElementById('marker_' + marker_id);
    this.args.marker_active.classList.add('active');

    this.args.el_story.className = '';
    this.args.el_story.classList.add('opened');
    this.args.el_story.classList.add(m[0].args.color);
    this.args.el_story.setAttribute('data-previous', m[0].args.marker_previous_id);
    this.args.el_story.setAttribute('data-current', m[0].args.marker_id);
    this.args.el_story.setAttribute('data-next', m[0].args.marker_next_id);
    this.args.el_story_header.innerHTML = m[0].args.label;

    var self = this;
    var _si = new Image();

    _si.onload = function () {

        var _sw = self.args.el_story_image.clientWidth;
        var _h = Math.floor((_sw * _si.height) / _si.width);

        self.args.el_story_image.style.backgroundImage = 'url(' + m[0].args.image + ')';
        self.args.el_story_image.style.height = _h + 'px';
    };

    _si.src = m[0].args.image;

    this.args.el_story_title.innerHTML = m[0].args.label;
    this.args.el_story_content.innerHTML = m[0].args.description;
};

Gladstone.prototype.storyClose = function () {

    this.args.el_story.className = '';
    this.args.el_story.setAttribute('data-previous', '');
    this.args.el_story.setAttribute('data-current', '');
    this.args.el_story.setAttribute('data-next', '');
    this.args.el_story_header.innerHTML = '';
    this.args.el_story_image.style.backgroundImage = '';
    this.args.el_story_image.style.height = '';
    this.args.el_story_title.innerHTML = '';
    this.args.el_story_content.innerHTML = '';

    if (this.args.marker_active !== null) {
        this.args.marker_active.classList.remove('active');
        this.args.marker_active = null;
    }

    this.map.panBy(window.innerWidth * 0.25, 0);
    this.map.setOptions({
        draggable: this.args.map_options.draggable
    });
};

Gladstone.prototype.storyPrevious = function () {

    var _dest = this.args.el_story.getAttribute('data-previous');
    this.storyOpen(_dest);
};

Gladstone.prototype.storyNext = function () {

    var _dest = this.args.el_story.getAttribute('data-next');
    this.storyOpen(_dest);
};
