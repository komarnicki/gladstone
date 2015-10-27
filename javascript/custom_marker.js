function CustomMarker(continent, latlng, map, args) {
    this.continent = continent;
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
        
        // Set ID of the current marker and chain closest marker on both left and right
        div.dataset.previous_id = self.args.marker_previous_id;
        div.dataset.next_id = self.args.marker_next_id;

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
