function Gladstone(key, canvas, markers) {

    try {

        this.key = key;
        this.canvas = canvas;
        this.markers = markers;

        var self = this;

        window.onload = function _() {
            var _s = document.createElement('script');
            _s.src = 'https://maps.googleapis.com/maps/api/js?key=' + self.key + '&sensor=false&callback=_c';
            document.body.appendChild(_s);
        };

        window._c = function() {
            self.initiate();
            document.getElementById('all_continents').click();
        };

    } catch(e) {
        console.log(e);
    }
}

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

        this.setMarkers();

    } catch(e) {
        console.log(e);
    }
};

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

            div = this.div = document.createElement('div');

            div.id = 'marker_' + self.args.marker_id;
            div.className = 'noselect marker ' + self.args.color;
            div.dataset.id = self.args.marker_id;
            div.dataset.previous_id = self.args.marker_previous_id;
            div.dataset.next_id = self.args.marker_next_id;

            div.innerHTML =
                '<span id="marker_pointer_' + self.args.marker_id + '" class="noselect marker_pointer ion-location ' + self.args.color + '"></span>' +
                '<span id="marker_label_' + self.args.marker_id + '" class="noselect marker_label">' + self.args.label + '</span>'
            ;

            google.maps.event.addDomListener(div, 'click', function () {
                gladstone.storyOpen(this.getAttribute('data-id'));
            });

            var panes = this.getPanes();
            panes.overlayImage.appendChild(div);
        }

        var point = this.getProjection().fromLatLngToDivPixel(this.latlng);

        if (point) {
            div.style.left = (point.x - 10) + 'px';
            div.style.top = (point.y - 10) + 'px';
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

    for (var i = 0; i < _m.length; i++) {
        for (var _k in _m[i]) {
            if (_v.indexOf(_k) === -1) _m.splice(i, 1);
        }
    }

    if ( ! (_m.length > 0)) {

        for (var i = 0; i < _h_cn.length; i++) {
            _h_cn[i].style.display = 'none';
        }

        for (var i = 0; i < _h_zm.length; i++) {
            _h_zm[i].style.display = 'none';
        }

        return false;
    }

    var listenContinent = function () {

        var _ca = this.getAttribute('id'),
            _m = self.filterMarkers(_ca),
            _ml = _m.length;

        if (_ml > 0 && self._map.boundsActive !== _ca) {

            self._map.boundsCollection = new google.maps.LatLngBounds();
            self._map.boundsActive = _ca;
            self.storyClose();
            self.highlighBounds(_ca);

            for (var i = 0; i < _ml; i++) {
                self._map.boundsCollection.extend(
                    new google.maps.LatLng(_m[i].latlng.lat(), _m[i].latlng.lng())
                );
            }

            self.map.fitBounds(self._map.boundsCollection);
        }
    };

    var listenZoom = function () {

        var _dir = this.getAttribute('id'),
            _z = self.map.getZoom();

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

        self._map.boundsActive = null;
    };

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

    google.maps.event.addDomListener(_s.close, 'click', function () {
        self.storyClose();
    });

    google.maps.event.addDomListener(_s.previous, 'click', function () {
        self.storyPrevious();
    });

    google.maps.event.addDomListener(_s.next, 'click', function () {
        self.storyNext();
    });

    if (this._markers.custom.length >= 2) this.detectMarkersCollisions();

    this._markers.dom = this._map.container.getElementsByClassName('marker');

    for (var i = 0; i < _h_cn.length; i++) {
        _h_cn[i].addEventListener('click', listenContinent, false);
    }

    for (var i = 0; i < _h_zm.length; i++) {
        _h_zm[i].addEventListener('click', listenZoom, false);
    }

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

Gladstone.prototype.filterMarkers = function (continent) {

    if (continent === 'all_continents') {
        return this._markers.custom;
    }

    return this._markers.custom.filter(function (marker) {
        return marker.continent === continent;
    });
};

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

        if (this._markers.dom.length > 1) _run();

    }.bind(this)));
};

Gladstone.prototype.countVisibleMarkers = function () {

    var bounds = this.map.getBounds();
    var m = this._markers.custom;
    var c = 0;

    for (var i = 0; i < m.length; i++) {
        if (bounds.contains(new google.maps.LatLng(m[i].latlng.lat(), m[i].latlng.lng()))) c++;
    }

    this._markers.visible = c;
};

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
};

Gladstone.prototype.storyClose = function () {

    var _s = this._story;

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
