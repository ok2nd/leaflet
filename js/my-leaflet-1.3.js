var map = L.map('map');
var tileLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=r&x={x}&y={y}&z={z}', {
	attribution: '<a href="https://developers.google.com/maps/documentation" target="_blank">Google Map</a>'
});
tileLayer.addTo(map);
iconMarkers = L.featureGroup();
var iconRed = L.icon({
	iconUrl: 'icon/marker-small.png',
	iconRetinaUrl: 'icon/marker-small.png',
	iconSize: [16, 27],
	iconAnchor: [7, 27],
	popupAnchor: [1, -22],
});
placeMarker(place, iconRed, '#ff4');
map.fitBounds(iconMarkers.getBounds());
var Basic_Map = new Array();
Basic_Map[ 0 ] = L.tileLayer('https://mt1.google.com/vt/lyrs=r&x={x}&y={y}&z={z}', {
	attribution: '<a href="https://developers.google.com/maps/documentation" target="_blank">Google Map</a>'
});
Basic_Map[ 1 ] = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	continuousWorld: false
});
Basic_Map[ 2 ] = L.tileLayer('https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png', {
	attribution: '<a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank">地理院タイル</a>'
});
Basic_Map[ 3 ] = L.tileLayer('https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg', {
	attribution: '<a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank">地理院タイル</a>'
});
Basic_Map[ 4 ] = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
	attribution: 'Tiles &copy; <a href="http://www.esrij.com/"> Esri Japan </a>'
});
var baseMap = {
	'Google マップ': Basic_Map[ 0 ],
	'OpenStreetMap': Basic_Map[ 1 ],
	'国土地理院 標準地図': Basic_Map[ 2 ],
	'国土地理院 写真': Basic_Map[ 3 ],
	'Esri World Topo Map': Basic_Map[ 4 ]
};
var Overlay_Map = new Array();
Overlay_Map[ 0 ] = L.tileLayer('https://cyberjapandata.gsi.go.jp/xyz/relief/{z}/{x}/{y}.png', {
	opacity: 0.2, maxNativeZoom: 15,
	attribution: '<a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank">地理院タイル</a>'
});
Overlay_Map[ 1 ] = L.tileLayer('https://cyberjapandata.gsi.go.jp/xyz/hillshademap/{z}/{x}/{y}.png', {
	opacity: 0.3, maxNativeZoom: 16,
	attribution: '<a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank">地理院タイル</a>'
});
Overlay_Map[ 2 ] = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
	opacity: 0.2,
	attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
});
var overlay = {
	'国土地理院 色別標高図': Overlay_Map[ 0 ],
	'国土地理院 陰影起伏図': Overlay_Map[ 1 ],
	'Esri 衛星画像': Overlay_Map[ 2 ]
};
L.control.layers(baseMap, overlay).addTo(map);
map.addControl(new L.Control.Fullscreen({	// フルスクリーンボタン
	title: {
		'false': '最大化',
		'true': '元に戻す'
	}
}));
var watch_id = 0;
var curMarker = null;
var currentWatchBtn = null;
/*
L.easyButton({
	states: [{
		stateName: 'current-watch',
		icon:	'fas fa-map-marker-alt',
		title:	 '現在地',
		onClick: function(btn, map) {
			currentWatch();
			btn.state('current-watch-reset');
			currentWatchBtn = btn;
		}
	}, {
		stateName: 'current-watch-reset',
		icon:	'fa fa-user',
		title:	 '現在地オフ',
		onClick: function(btn, map) {
			currentWatchReset();
			btn.state('current-watch');
		}
	}]
}).addTo( map );
*/
L.easyButton('fas fa-map-marker-alt', function(btn, easyMap) {	// 現在地表示ボタン
	currentWatchReset();
	currentWatch();
}).addTo(map);
L.easyButton('fa fa-times', function(btn, easyMap) {
	currentWatchReset();
}).addTo(map);
L.easyButton('fa fa-reply-all', function(btn, easyMap) {
	currentWatchReset();
	if (currentWatchBtn) {
		currentWatchBtn.state('current-watch');
		currentWatchBtn = null;
	}
	map.fitBounds(iconMarkers.getBounds());
}).addTo(map);
map.on('click', onMapClick);
var clickMarker = null;
function onMapClick(e) {
	if (clickMarker) {
		map.removeLayer(clickMarker);
	}
	lat = e.latlng.lat;
	lng = e.latlng.lng;
	// 地理院地図サーバから標高を求める	http://maps.gsi.go.jp/development/elevation_s.html
	var src = 'https://cyberjapandata2.gsi.go.jp/general/dem/scripts/getelevation.php?lon=' + lng + '&lat=' + lat ;
/* ========================================
	var req = new XMLHttpRequest();
	req.onreadystatechange = function() {
		if(req.readyState == 4 && req.status == 200) {
			var json = req.responseText;
			var results = JSON.parse(json);
			var popStr = '<a href="http://maps.google.com/maps?q=' + lat + '%2C' + lng + '" target="_blank">' + '緯度：' + lat + '<br>経度：' + lng + '</a><br>標高：' + '' + results.elevation + 'm';
			clickMarker = L.marker(e.latlng).on('click', onMarkerClick).addTo(map).bindPopup(popStr).openPopup();
		}
	};
	req.open('GET', src, false);
	req.send(null)
======================================== */
	fetch(src)
	.then((response) => {
		return response.text();
	})
	.then((text) => {	// text: json
		var results = JSON.parse(text);
		var popStr = '<a href="http://maps.google.com/maps?q=' + lat + '%2C' + lng + '" target="_blank">' + '緯度：' + lat + '<br>経度：' + lng + '</a><br>標高：' + '' + results.elevation + 'm';
		clickMarker = L.marker(e.latlng).on('click', onMarkerClick).addTo(map).bindPopup(popStr).openPopup();
	})
}
function onMarkerClick(e) {
	map.removeLayer(clickMarker);
}
var curIcon = L.icon({
	iconUrl: 'icon/hiking.png',
	iconRetinaUrl: 'icon/hiking.png',
	iconAnchor: [15, 34]
});
var currentWatch_on = false;
function currentWatch() {
	function success(pos) {
		var lat = pos.coords.latitude;
		var lng = pos.coords.longitude;
		if (currentWatch_on == false) {
			map.setView([ lat,lng ]);
			currentWatch_on = true;
		}
		if (curMarker) {
			map.removeLayer(curMarker);
		}
		curMarker = L.marker([lat, lng], {icon: curIcon}).addTo(map);
	}
	function error(err) {
		alert('位置情報を取得できませんでした。');
	}
	var options = {
		enableHighAccuracy: true,
		timeout: 5000,
		maximumAge: 0
	};
	if (watch_id == 0) {
		watch_id = navigator.geolocation.watchPosition(success, error, options);
	}
}
function currentWatchReset() {
	currentWatch_on = false;
	if (watch_id > 0) {
		navigator.geolocation.clearWatch(watch_id);
		watch_id = 0;
	}
	if (curMarker) {
		map.removeLayer(curMarker);
		curMarker = null;
	}
}
function placeMarker(place, myIcon, bgcolor) {
	for (var i = 0; i < place.length; i++) {
		var divIcon = L.divIcon({
			html: '<div class="divicon">' + place[i].name + '</div>',
			iconSize: [0,0]
		});
		iconMarkers.addLayer( L.marker([place[i].lat, place[i].lng], {icon: myIcon}).addTo(map).bindPopup(place[i].popstr) );
		L.marker([place[i].lat, place[i].lng], {icon: divIcon}).addTo(map);
	}
}
