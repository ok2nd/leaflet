/* --------- KML サンプル ---------
	<Placemark>
		<name>★松竹梅</name>
		<description>34.9377292058504,135.747129321098</description>
		<styleUrl>#icon-1603-FF5252-labelson</styleUrl>
		<Point>
			<coordinates>
		135.747129321098,34.9377292058504,0
			</coordinates>
		</Point>
	</Placemark>
*/
var map;
var watch_id = 0;
var curMarker = null;	// 現在地マーカー
var currentWatchBtn = null;
var iconRed = L.icon({
	iconUrl: 'icon/red-dot.png',
	iconRetinaUrl: 'icon/red-dot.png',
	iconSize: [32, 32],
	iconAnchor: [14, 27],
	popupAnchor: [1, -22],
});
function kml2map(kmlStr) {
	map = L.map('map');
	var tileLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=r&x={x}&y={y}&z={z}', {
		attribution: '<a href="https://developers.google.com/maps/documentation" target="_blank">Google Map</a>'
	});
	tileLayer.addTo(map);
	var iconMarkers = L.featureGroup();
	// ---------------------------------------------------
	var parser = new DOMParser();
	var kml = parser.parseFromString(kmlStr, 'text/xml');
	var elements = kml.getElementsByTagName('Placemark');
	// ---------------------------------------------------
	for (var i=0; i<(elements.length-1); i++) {
		let pos = kmlParse(elements.item(i));
		var divIcon = L.divIcon({
			html: '<div class="divicon">' + pos['name'] + '</div>',
			iconSize: [0,0]
		});
		var popStr = '<a href="http://www.google.com/search?q=' + encodeURI(pos['name']) + '" target="_blank">' + pos['name'] + '</a>';
		iconMarkers.addLayer(L.marker([pos['lat'], pos['lng']], {icon: iconRed}).addTo(map).bindPopup(popStr));
		L.marker([pos['lat'], pos['lng']], {icon: divIcon}).addTo(map);
	}
	map.fitBounds(iconMarkers.getBounds());
	// ---------------------------------------------------
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
	L.control.layers(baseMap).addTo(map);
	map.addControl(new L.Control.Fullscreen({	// フルスクリーンボタン
		title: {
			'false': '最大化',
			'true': '元に戻す'
		}
	}));
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
	L.easyButton('fa fa-reply-all', function(btn, easyMap) {
		currentWatchReset();
		if (currentWatchBtn) {
			currentWatchBtn.state('current-watch');
			currentWatchBtn = null;
		}
		map.fitBounds(iconMarkers.getBounds());
	}).addTo(map);
	L.easyButton('fa-walking', function(btn, easyMap) {
		posMarkerRemove();
		endMarkerRemove();
		routeControlReset();
		route_mode = true;
		btn.state('route-off');
	}).addTo(map);
	L.easyButton('fa fa-times', function(btn, easyMap) {
		posMarkerRemove();
		endMarkerRemove();
		routeControlReset();
		route_mode = false;
	}).addTo(map);
	map.on('click', onMapClick);
}
// ------------------------------------------
var route_mode = true;
function onMapClick(e) {
	if (route_mode) {
		routeProc(e);
	} else {
		currentPop(e);
	}
}
// クリックした地点の緯度・経度、標高を表示
var posMarker = null;
function currentPop(e) {
	if (posMarker) {
		map.removeLayer(posMarker);
	}
	if (routeControl) {
		map.removeControl(routeControl);
	}
	lat = e.latlng.lat;
	lng = e.latlng.lng;
	// 地理院地図サーバから標高を求める
	// http://maps.gsi.go.jp/development/elevation_s.html
	var src = 'https://cyberjapandata2.gsi.go.jp/general/dem/scripts/getelevation.php?lon=' + lng + '&lat=' + lat;
	fetch(src)
	.then((response) => {
		return response.text();
	})
	.then((text) => {	// text: json
		var results = JSON.parse(text);
		var popStr = '緯度：' + lat + '<br>経度：' + lng + '<br>標高：' + results.elevation + 'm';
		var popStr = '<a href="http://maps.google.com/maps?q=' + lat + '%2C' + lng + '" target="_blank">' + '緯度：' + lat + '<br>経度：' + lng + '</a><br>標高：' + '' + results.elevation + 'm';
		posMarker = L.marker(e.latlng).on('click', posMarkerRemove).addTo(map).bindPopup(popStr).openPopup();
	})
}
function posMarkerRemove() {
	if (posMarker) {
		map.removeLayer(posMarker);
		posMarker = null;
	}
}
function startMarkerRemove() {		// Routing.controlが動作していると、ここには飛ばない
	if (startMarker) {
		map.removeLayer(startMarker);
		startMarker = null;
	}
	if (routeControl) {
		map.removeControl(routeControl);
		routeControl = null;
	}
}
function endMarkerRemove() {		// Routing.controlが動作していると、ここには飛ばない
	if (endMarker) {
		map.removeLayer(endMarker);
		endMarker = null;
	}
	routeControlReset();
}
function routeControlReset() {
	if (startMarker) {
		map.removeLayer(startMarker);
		startMarker = null;
	}
	if (routeControl) {
		map.removeControl(routeControl);
		routeControl = null;
	}
}
// クリックした地点2箇所の経路検索
var dummyIcon = L.icon({
	iconUrl: 'icon/10x10.png',
	iconRetinaUrl: 'icon/10x10.png',
	iconSize: [16, 27],
	iconAnchor: [7, 27],
	popupAnchor: [1, -22],
});
var iconStart = L.icon({
	iconUrl: 'icon/green-dot.png',
	iconRetinaUrl: 'icon/green-dot.png',
	iconSize: [32, 32],
	iconAnchor: [16, 30],
	popupAnchor: [1, -22],
});
var iconEnd = L.icon({
	iconUrl: 'icon/orange-dot.png',
	iconRetinaUrl: 'icon/orange-dot.png',
	iconSize: [32, 32],
	iconAnchor: [16, 30],
	popupAnchor: [1, -22],
});
var startMarker = null;
var endMarker = null;
var endLatLng;
var routeControl = null;
function routeProc(e) {
	if (posMarker) {
		map.removeLayer(posMarker);
	}
	lat = e.latlng.lat;
	lng = e.latlng.lng;
	if (endMarker == null) {
		endMarker = L.marker([lat, lng], {icon: iconEnd}).on('click', endMarkerRemove).addTo(map);
		endLatLng = e.latlng;
	} else {
		if (startMarker) {
			routeControlReset();
		}
		startMarker = L.marker([lat, lng], {icon: iconStart}).on('click', startMarkerRemove).addTo(map);
		routingView(e.latlng, endLatLng);
	}
}
function routingView(startLatLng, endLatLng) {
	routeControl = L.Routing.control({
		serviceUrl: 'https://routing.openstreetmap.de/routed-foot/route/v1',
		show: false,	// ルート詳細パネルを表示しない
		lineOptions: {
			styles: [
				{color: 'black', opacity: 0.1, weight: 6},
				{color: 'fuchsia', opacity: 0.4, weight: 5}
			]
		},
		altLineOptions: {
			styles: [
				{color: 'black', opacity: 0.1, weight: 6},
				{color: 'aqua', opacity: 0.5, weight: 5}
			]
		},
		createMarker: function(i, wp, nWps) {
			return L.marker(wp.latLng, {
				icon: dummyIcon
			});
		},
		waypoints: [
			L.latLng(startLatLng),
			L.latLng(endLatLng)
		]
	}).addTo(map);
}
// ------------------------------------------
function kmlParse(Placemark) {
	let latLng = Placemark.getElementsByTagName('coordinates')[0].textContent.split(',');
	return {
		name: Placemark.getElementsByTagName('name')[0].textContent,
		lat: parseFloat(latLng[1]),
		lng: parseFloat(latLng[0])
	}
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
