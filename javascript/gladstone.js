function Gladstone(selector, markers) {

    try {

        this.args = {
            map_element: document.getElementById(selector),
            map_bounds: new google.maps.LatLngBounds(),
            map_markers: markers,
            map_markers_dom: null,
            map_markers_custom: [],
            map_markers_count_visible: 0,
            map_continent_active: null,
            map_continent_default: 'australia',
            map_position_current: null,
            map_position_default: new google.maps.LatLng(-27.480515, 153.066031), // Brisbane
            map_options: {
                styles: [ { featureType: 'administrative', elementType: 'all', stylers: [ { visibility: 'off' } ] }, { featureType: 'landscape', elementType: 'all', stylers: [ {hue: '#FFFFFF'}, {saturation: -100}, {lightness: 100}, {visibility: 'on'} ] }, { featureType: 'poi', elementType: 'all', stylers: [ {visibility: 'off'} ] }, { featureType: 'road', elementType: 'all', stylers: [ {visibility: 'on'}, {lightness: -30} ] }, { featureType: 'road', elementType: 'labels', stylers: [ {visibility: 'off'} ] }, { featureType: 'transit', elementType: 'all', stylers: [ {visibility: 'off'} ] }, { featureType: 'water', elementType: 'all', stylers: [ {saturation: -100}, {lightness: -100} ] }, { featureType: 'landscape', elementType: 'labels.text', stylers: [ {visibility: 'off'} ] }, { featureType: 'all', elementType: 'all', stylers: [ {saturation: -100}, {lightness: 91} ] } ],
                zoom: 5,
                minZoom: 3,
                maxZoom: 17,
                mapTypeId: google.maps.MapTypeId.ROADMAP,
                scrollwheel: true,
                disableDefaultUI: true,
                disableDoubleClickZoom: true,
                draggableCursor: 'default'
            },
            map_limit_lat_north: 60,
            map_limit_lat_south: -52
        };

        this.map = new google.maps.Map(this.args.map_element, this.args.map_options);
        this.map.setCenter(this.args.map_position_default);
        this.map.setZoom(this.args.map_options.zoom);
        this.map.addListener('dragstart', (function () {
            this.args.map_position_current = new google.maps.LatLng(this.map.getCenter().lat(), this.map.getCenter().lng());
        }.bind(this)));

        this.setMarkers();

    } catch(e) {
        console.log('WARNING! Gladstone Exception!');
        console.log('Message: ' + e);
    }
}

Gladstone.prototype.setMarkers = function () {

    var markers = this.args.map_markers;
    var ch = document.getElementsByClassName('continent_handler');
    var zh = document.getElementsByClassName('zoom_handler');
    var valid_keys = ['id', 'latitude', 'longitude', 'continent', 'color', 'label', 'description'];

    // If no markers, then hide unnecessary icons, set minimum zoom on the map and say Goodbye!
    if (markers.length === 0) {

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
        var _fml = fm.length;

        // No point in switching bounds to continent that has no markers
        if (_fml > 0) {

            self.storyClose();

            for (var i = 0; i < ch.length; i++) {
                ch[i].classList.remove('active');
            }

            // Highlight current continent handler icon
            this.classList.add('active');

            self.args.map_continent_active = ca; // Set active continent arg
            self.args.map_bounds = new google.maps.LatLngBounds();

            if (_fml > 1) {

                // Each marker from active continent will extend map bounds
                for (var i = 0; i < _fml; i++) {
                    self.args.map_bounds.extend(new google.maps.LatLng(fm[i].latlng.lat(), fm[i].latlng.lng()));
                }

                self.map.fitBounds(self.args.map_bounds);

            } else {

                // Single marker? So just center on it and zoom
                self.map.setCenter(new google.maps.LatLng(fm[0].latlng.lat(), fm[0].latlng.lng()));
                self.map.setZoom(6);
            }
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
    };

    // Validate input
    for (var i = 0; i < markers.length; i++) {
        for (var _k in markers[i]) {
            // Remove the marker entirely from input array before passing to CustomMarker object
            if (valid_keys.indexOf(_k) === -1) markers.splice(markers[i], 1);
        }
    }

    // Create custom markers from validated input
    for (var i = 0; i < markers.length; i++) {

        var _prev = (i === 0) ? markers.length - 1 : i - 1;
        var _next = (i === markers.length - 1) ? 0 : i + 1;

        this.args.map_markers_custom.push(
            new CustomMarker(
                markers[i].continent,
                new google.maps.LatLng(markers[i].latitude, markers[i].longitude),
                this.map,
                {
                    marker_id: markers[i].id,
                    marker_previous_id: markers[_prev].id,
                    marker_next_id: markers[_next].id,
                    color: markers[i].color,
                    label: markers[i].label
                }
            )
        );
    }

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

Gladstone.prototype.limitGlobalLatitude = function () {

    // There's no point of limiting the latitude when all markers have to be displayed
    if (this.args.map_continent_active == 'map_restore') return;

    var _mb = {
        lat_max: this.map.getBounds().getNorthEast().lat(),
        lat_min: this.map.getBounds().getSouthWest().lat(),
        lng_min: this.map.getBounds().getSouthWest().lng(),
        lng_max: this.map.getBounds().getNorthEast().lng()
    };

    // Limit north
    if (_mb.lat_max > this.args.map_limit_lat_north && this.args.map_position_current !== null) {
        this.map.setCenter(this.args.map_position_current);
    }

    // Limit south
    if (_mb.lat_min < this.args.map_limit_lat_south && this.args.map_position_current !== null) {
        this.map.setCenter(this.args.map_position_current);
    }
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

        this.args.map_continent_active = null;

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

    this.storyClose();

    var story = document.getElementById('story');
    var story_close = document.getElementById('story_close');
    var m = this.args.map_markers_custom.filter(function (marker) {
        return marker.args.marker_id == marker_id;
    });

    if (story.classList.contains('opened') === true && story.getAttribute('data-current') == m[0].args.marker_id) return false;

    this.map.panTo(new google.maps.LatLng(m[0].latlng.lat(), m[0].latlng.lng()));
    this.map.panBy(window.innerWidth * -0.25, 0);

    story.classList.add('opened');
    story.classList.add(m[0].args.color);
    story.setAttribute('data-previous', m[0].args.marker_previous_id);
    story.setAttribute('data-current', m[0].args.marker_id);
    story.setAttribute('data-next', m[0].args.marker_next_id);

    story_close.addEventListener('click', this.storyClose, false);
};

Gladstone.prototype.storyClose = function () {

    var story = document.getElementById('story');

    story.className = '';
    story.setAttribute('data-previous', '');
    story.setAttribute('data-current', '');
    story.setAttribute('data-next', '');

    console.log(this.map);

    //this.map.panBy(window.innerWidth * 0.25, 0);
};
