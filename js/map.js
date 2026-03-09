    /* ==============================================
    MAP -->
    =============================================== */

    function initMap() {
        var locations = [[
            '<div class="infobox"><h3 class="title"><a href="#">OUR LAGOS OFFICE</a></h3><span>12 Adeola Odeku Street, Victoria Island, Lagos, Nigeria</span><span>+234 801 234 5678</span></div>',
            6.4281,
            3.4219,
            2
        ]];

        var map = new google.maps.Map(document.getElementById('googleMap'), {
            zoom: 14,
            scrollwheel: false,
            navigationControl: true,
            mapTypeControl: false,
            scaleControl: false,
            draggable: true,
            center: new google.maps.LatLng(6.4281, 3.4219),
            mapTypeId: google.maps.MapTypeId.ROADMAP
        });

        var infowindow = new google.maps.InfoWindow();

        for (var i = 0; i < locations.length; i++) {
            var marker = new google.maps.Marker({
                position: new google.maps.LatLng(locations[i][1], locations[i][2]),
                map: map
            });

            google.maps.event.addListener(marker, 'click', (function(marker, i) {
                return function() {
                    infowindow.setContent(locations[i][0]);
                    infowindow.open(map, marker);
                };
            })(marker, i));
        }
    }