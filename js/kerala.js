// Simple map
var SELECTED_ROADS_SOURCE;

mapboxgl.accessToken = PUBLIC_ACCESS_TOKEN;
var map = new mapboxgl.Map({
    container: 'map',
    style: STYLESHEET,
    hash: true
});

map.on('style.load', function(e) {

    addSourcesAndLayers();
    var location = new mapboxgl.GeolocateControl({
        positionOptions: {
            enableHighAccuracy: true
        },
        trackUserLocation: true
    });
    map.addControl(new MapboxGeocoder({
	accessToken:PUBLIC_ACCESS_TOKEN
    }));
    map.addControl(location);
    map.addControl(new mapboxgl.NavigationControl());
    setTimeout(function(){ 
	setInterval(function(){
		$("#feature-count").text(map.queryRenderedFeatures({layers:['selected-roads']}).length);
	},3000);
	location.trigger();
    }, 3000);
});

function deleteRoad(features) {
    $('#map').addClass('loading');
    var url = DATASETS_BASE + 'features/' + features[0].properties.id + '?access_token=' + DATASETS_ACCESS_TOKEN;
    $.ajax({
        method: 'DELETE',
        url: url,
        contentType: 'application/json',
        success: function() {
	        refreshTiles();
        },
        error: function() {
            $('#map').toggleClass('loading');
        }
    });
}

function refreshTiles(){
    var url = DATASETS_BASE + 'features?access_token='+DATASETS_ACCESS_TOKEN;
    if(map.getSource('custom-roads')){
		map.removeLayer('selected-roads');
		map.removeSource('custom-roads');
	}
	map.addSource('custom-roads', {
	    type: 'geojson',
	    data: url
	});
	map.addLayer({
	    'id': 'selected-roads',
	    'type': 'line',
	    'source': 'custom-roads',
	    'interactive': true,
	    'paint': {
		'line-color': '#ff0000',
		'line-width': 3,
		'line-opacity': 0.6
	    }
	});
	$('#map').removeClass('loading');
}

function addRoad(features) {
    $('#map').addClass('loading');
    var tempObj = {
        type: 'Feature',
        geometry: features[0].geometry,
        properties: features[0].properties,
    };
    tempObj.properties['is_flooded'] = true;
    tempObj.properties['timestamp'] = Date.now();
    tempObj.id = md5(JSON.stringify(tempObj));
    tempObj.properties['id'] = tempObj.id;

    var url = DATASETS_BASE + 'features/' + tempObj.id + '?access_token=' + DATASETS_ACCESS_TOKEN;
    $.ajax({
        method: 'PUT',
        url: url,
        data: JSON.stringify(tempObj),
        dataType: 'json',
        contentType: 'application/json',
        success: function(response) {
	        refreshTiles();
        },
        error: function() {
            $('#map').toggleClass('loading');
        }
    });
}

function addSourcesAndLayers() {
    refreshTiles();
    map.on('click', function(e) {
            if (map.getZoom() < 15) {
		$("#copy").addClass("visible");
		setTimeout(function(){$("#copy").removeClass("visible");},5000);
            }else if (confirm("Are you sure ? Press ok to edit.")){
		var point = e.point;
                var features = map.queryRenderedFeatures(
            		[
            		  [point.x - 20 / 2, point.y - 20 / 2],
            		  [point.x + 20 / 2, point.y + 20 / 2]
            		], {
                    radius: 5,
                    includeGeometry: true,
                    layers: ['selected-roads']
                });
                if (features.length) {
                    deleteRoad(features);
                } else {
                    var features = map.queryRenderedFeatures(point, {
                        radius: 5,
                        includeGeometry: true,
                        layers: ['road','bridge']
                    });
                    if (features.length) {
                        addRoad(features);
                    }
                }
	    }
        });

    map.addSource('terrain-data', {
        type: 'vector',
        url: 'mapbox://mapbox.mapbox-terrain-v2'
    });
    map.addLayer({
        'id': 'terrain-data',
        'type': 'line',
        'source': 'terrain-data',
        'source-layer': 'contour',
        'layout': {
            'line-join': 'round',
            'line-cap': 'round'
        },
        'paint': {
            'line-color': '#ff69b4',
            'line-opacity': 0.3,
            'line-width': 1
        }
    });
}

$(function() {
    $('#sidebar').mCustomScrollbar({
        theme: 'rounded-dots',
        scrollInertia: 100,
        callbacks: {
            onInit: function() {
                $('#sidebar').css('overflow', 'auto');
            }
        }
    });
    $('#menu').on('click',function(){
	$('#sidebar').toggleClass('visible');
    });
});

