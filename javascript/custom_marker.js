function CustomMarker(latlng, map, args) {
    this.latlng = latlng;
    this.args = args;
    this.setMap(map);
}

CustomMarker.prototype = new google.maps.OverlayView();

CustomMarker.prototype.draw = function () {

    var self = this;

    var div = this.div;

    if (!div) {

        div = this.div = document.createElement('div');
        div.id = 'marker_' + self.args.marker_id;
        div.className = 'noselect marker ' + self.args.color;

        div.innerHTML =
            '<span id="marker_pointer_' + self.args.marker_id + '" class="noselect marker_pointer ion-location ' + self.args.color + '"></span>' +
            '<span id="marker_label_' + self.args.marker_id + '" class="noselect marker_label">' + self.args.location_name + '</span>'
        ;

        var panes = this.getPanes();
        panes.overlayImage.appendChild(div);
    }

    var point = this.getProjection().fromLatLngToDivPixel(this.latlng);

    if (point) {
        div.style.left = (point.x - 10) + 'px';
        div.style.top = (point.y - 10) + 'px';
    }
};
