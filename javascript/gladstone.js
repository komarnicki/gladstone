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
            self.init();
        };

    } catch(e) {
        console.log(e);
    }
}

Gladstone.prototype.init = function () {

    try {

        this._map = {
            'container': document.getElementById(this.canvas) || null,
            'options': {
                styles: [{featureType:'administrative',elementType:'all',stylers:[{visibility:'off'}]},{featureType:'landscape',elementType:'all',stylers:[{hue:'#FFFFFF'},{saturation:-100},{lightness:100},{visibility:'on'}]},{featureType:'poi',elementType:'all',stylers:[{visibility:'off'}]},{featureType:'road',elementType:'all',stylers:[{visibility:'on'},{lightness:-30}]},{featureType:'road',elementType:'labels',stylers:[{visibility:'off'}]},{featureType:'transit',elementType:'all',stylers:[{visibility:'off'}]},{featureType:'water',elementType:'all',stylers:[{saturation:-100},{lightness:-100}]},{featureType:'landscape',elementType:'labels.text',stylers:[{visibility:'off'}]},{featureType:'all',elementType:'all',stylers:[{saturation:-100},{lightness:91}]}],
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
            'boundsCollection': new google.maps.LatLngBounds(),
            'boundsActive': null
        };

        this._markers = {
            'data': this.markers,
            'dom': null,
            'custom': [],
            'getVisibleCount': 0,
            'getActive': null
        };

        this._story = {

        };

        this.map = new google.maps.Map(this._map.container, this._map.options);
        this.map.setCenter(new google.maps.LatLng(-27.480515, 153.066031));
        this.map.setZoom(this._map.options.zoom);

        this.setMarkers();

    } catch(e) {
        console.log(e);
    }
};

Gladstone.prototype.setMarkers = function () {

    var self = this,
        _m = self._markers.data,
        _h_cn = document.getElementsByClassName('continent_handler'),
        _h_zm = document.getElementsByClassName('zoom_handler'),
        valid_keys = [
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
            if (valid_keys.indexOf(_k) === -1) _m.splice(i, 1);
        }
    }

    if ( ! (_m.length > 0)) {

        for (var i = 0; i < _h_cn.length; i++) {
            _h_cn[i].style.display = 'none';
        }

        for (var i = 0; i < _h_zm.length; i++) {
            _h_zm[i].style.display = 'none';
        }

        this.map.setZoom(this._map.options.minZoom);
        return false;
    }

    self._map.boundsCollection = new google.maps.LatLngBounds();

    for (var i = 0; i < _m.length; i++) {

        var _continent = _m[i].continent,
            _prev = (i === 0) ? _m.length - 1 : i - 1,
            _next = (i === _m.length - 1) ? 0 : i + 1,
            _ll = new google.maps.LatLng(_m[i].latitude, _m[i].longitude),
            _args = {
                marker_id: _m[i].id,
                marker_previous_id: _m[_prev].id,
                marker_next_id: _m[_next].id,
                color: _m[i].color,
                image: _m[i].image,
                date: _m[i].date,
                label: _m[i].label,
                zoom: _m[i].zoom,
                description: _m[i].description
            };

        this._markers.custom.push(
            new CustomMarker(_continent, _ll, this.map, _args)
        );

        self._map.boundsCollection.extend(_ll);
    }

    self.map.fitBounds(self._map.boundsCollection);
    self._map.boundsActive = 'map_restore';
};
