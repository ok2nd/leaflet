/* --------- GPX サンプル ---------
	<trkpt lat="34.724837" lon="135.158676">
		<ele>326.27</ele>
		<time>2021-05-04T01:34:20.000Z</time>
		<extensions>
			<geotracker:meta c="2.91" s="0" />
		</extensions>
	</trkpt>
*/
var map;
var clickMarker = null;
var watch_id = 0;
var curMarker = null;	// 現在地マーカー
var currentWatchBtn = null;
var chartFlag = false;
var routeLatLngAll = [];
var routeLatLngAllCnt = 0;
function gpx2map(gpxFileStr, resetBtn=false) {
	winResize();
	window.addEventListener('DOMContentLoaded', function() {
		window.addEventListener('resize', function() {
			winResize();
		});
	});
	map = L.map('map');
	let gpxFile = gpxFileStr.split(',');
	for (var i=0; i<gpxFile.length; ++i) {
		fetch(gpxFile[i])
		.then((response) => {
			if(response.ok) { // ステータスがokならば
				return response.text(); // レスポンスをテキストとして変換する
			} else {
				throw new Error();
			}
		})
		.then((text) => {
			gpx2polyline(text);		// text: gpxデータ
		})
		.catch((error) => {
			let div = document.getElementById('container');
			div.innerHTML = '<div class="msg"><p>GPXファイル（<span class="emp">' + gpxFile[i] + '</span>）が見つかりません。</span></p></div>';
		})
	}
	// ---------------------------------------------------
	var tileLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=r&x={x}&y={y}&z={z}', {
		attribution: '<a href="https://developers.google.com/maps/documentation" target="_blank">Google Map</a>'
	});
	tileLayer.addTo(map);
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
	// ---------------------------------------------------
	map.addControl(new L.Control.Fullscreen({	// フルスクリーンボタン
		title: {
			'false': '最大化',
			'true': '元に戻す'
		}
	}));
	// ---------------------------------------------------
	L.easyButton('fas fa-map-marker-alt', function(btn, easyMap) {	// 現在地表示ボタン
		currentWatchReset();
		currentWatch();
	}).addTo(map);
	L.easyButton('fa fa-times', function(btn, easyMap) {
		currentWatchReset();
	}).addTo(map);
	L.easyButton('fa fa-reply-all', function(btn, easyMap) {	// マーカーすべて表示画面に戻るボタン
		currentWatchReset();
		if (currentWatchBtn) {
			currentWatchBtn.state('current-watch');
			currentWatchBtn = null;
		}
		map.fitBounds(routeLatLngAll);
	}).addTo(map);
	if (resetBtn) {
		L.easyButton('<i class="fas fa-window-close"></i>', function(btn, easyMap) {	// 初期状態に戻るボタン
			location.reload();
		}).addTo(map);
	}
	map.on('click', onMapClick);	// クリックした地点の緯度・経度、標高を表示
	return 0;
}
function gpx2polyline(gpxStr) {
	var routeLatLng = [];
	var parser = new DOMParser();
	var gpx = parser.parseFromString(gpxStr, 'text/xml');
	var elements = gpx.getElementsByTagName('trkpt');
	// ---------------------------------------------------
	var distTotal = 0;
	var before = {};
	var height_max = -10000;
	var height_min = 10000;
	var chartEle = [];
	var pointCnt = 0;
	for (var i=0; i<(elements.length); i++) {
		let pos = gpxParse(elements.item(i));
		if (i == 0) {
			var startTime = pos['time'].getTime();
		} else {
			let before = gpxParse(elements.item(i-1));
			distTotal += distance(before['lat'], before['lon'], pos['lat'], pos['lon'], false);
		}
		height = parseFloat(pos['ele']);
		if (height_max < height) height_max = height;
		if (height_min > height) height_min = height;
		chartEle[i] = [pos['time'].getTime() + 60*60*9*1000, parseInt(height)];	// 日本時間
		routeLatLng[i] = [pos['lat'], pos['lon']];
		routeLatLngAll[routeLatLngAllCnt++] = [pos['lat'], pos['lon']];
	//	if (pos['time'].getTime() > (preTime + (60*30*1000)) ) {	// 30分間隔
		if (pos['time'].getTime() > (startTime + (60*30*1000) * pointCnt) ) {	// 30分間隔
			timeLavel(pos['lat'], pos['lon'], pos['time']);
	//		preTime = pos['time'].getTime();
			pointCnt++;
		}
	}
	// ---------------------------------------------------
	L.polyline(routeLatLng, {color: '#3B83CC', weight: 5}).addTo(map);
	map.fitBounds(routeLatLngAll);
}
function onMapClick(e) {
	if (clickMarker) {
		map.removeLayer(clickMarker);
	}
	lat = e.latlng.lat;
	lng = e.latlng.lng;
	// 地理院地図サーバから標高を求める
	// http://maps.gsi.go.jp/development/elevation_s.html
	var src = 'https://cyberjapandata2.gsi.go.jp/general/dem/scripts/getelevation.php?lon=' + lng + '&lat=' + lat ;
/* ========================================
	var req = new XMLHttpRequest();
	req.onreadystatechange = function() {
		if(req.readyState == 4 && req.status == 200) {
			var json = req.responseText;
			var results = JSON.parse(json);
			var popStr = '緯度：' + lat + '<br>経度：' + lng + '<br>標高：' + results.elevation + 'm';
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
		var popStr = '緯度：' + lat + '<br>経度：' + lng + '<br>標高：' + results.elevation + 'm';
		clickMarker = L.marker(e.latlng).on('click', onMarkerClick).addTo(map).bindPopup(popStr).openPopup();
	})
}
function onMarkerClick(e) {
	map.removeLayer(clickMarker);
}
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
		var curIcon = L.icon({	/* アイコン */
			iconUrl: 'icon/hiking.png',
			iconRetinaUrl: 'icon/hiking.png',
			iconAnchor: [15, 34]
		});
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
		watch_id = navigator.geolocation.watchPosition(success, error, options); // 現在地情報を定期的に
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
function gpxParse(trkpt) {
	var timeTxt = trkpt.getElementsByTagName('time')[0].textContent;
	var time = new Date(timeTxt);
	return {
		lat: parseFloat(trkpt.getAttribute('lat')),
		lon: parseFloat(trkpt.getAttribute('lon')),
		time: time,
		dateStr: time.toLocaleDateString(),
		timeStr: time.toLocaleTimeString(),
		ele: trkpt.getElementsByTagName('ele')[0].textContent
	};
}
function distance(lat1, lon1, lat2, lon2, mode=true) {
/**
 * ２地点間の距離(m)を求める
 * ヒュベニの公式から求めるバージョン
 * https://qiita.com/chiyoyo/items/b10bd3864f3ce5c56291
 * @param float $lat1 緯度１
 * @param float $lon1 経度１
 * @param float $lat2 緯度２
 * @param float $lon2 経度２
 * @param boolean $mode 測地系 true:世界(default) false:日本
 * @return float 距離(m)
 */
	// 緯度経度をラジアンに変換
	radLat1 = lat1 * (Math.PI / 180);
	radLon1 = lon1 * (Math.PI / 180);
	radLat2 = lat2 * (Math.PI / 180);
	radLon2 = lon2 * (Math.PI / 180);
	// 緯度差
	radLatDiff = radLat1 - radLat2;
	// 経度差算
	radLonDiff = radLon1 - radLon2;
	// 平均緯度
	radLatAve = (radLat1 + radLat2) / 2.0;
	// 測地系による値の違い
	a = mode ? 6378137.0 : 6377397.155; // 赤道半径
	b = mode ? 6356752.314140356 : 6356078.963; // 極半径
	//e2 = (a*a - b*b) / (a*a);
	e2 = mode ? 0.00669438002301188 : 0.00667436061028297; // 第一離心率^2
	//a1e2 = a * (1 - e2);
	a1e2 = mode ? 6335439.32708317 : 6334832.10663254; // 赤道上の子午線曲率半径
	sinLat = Math.sin(radLatAve);
	W2 = 1.0 - e2 * (sinLat*sinLat);
	M = a1e2 / (Math.sqrt(W2)*W2); // 子午線曲率半径M
	N = a / Math.sqrt(W2); // 卯酉線曲率半径
	t1 = M * radLatDiff;
	t2 = N * Math.cos(radLatAve) * radLonDiff;
	dist = Math.sqrt((t1*t1) + (t2*t2));
	return dist;
}
function timeLavel(lat, lon, time) {
	let timeLavel = L.divIcon({
		html: '<div class="timeLavel">' + time.toLocaleTimeString().substr(0,5) + '</div>',
		iconSize: [0,0]
	});
	L.marker([lat, lon], {icon: timeLavel}).addTo(map);
}
function time2str(time) {
	var timeHour = time / (1000 * 60 * 60);
	var timeMinute = (timeHour - Math.floor(timeHour)) * 60;
	var timeSecond = (timeMinute - Math.floor(timeMinute)) * 60;
	return ('00' + Math.floor(timeHour)).slice(-2) + ':' + ('00' + Math.floor(timeMinute)).slice(-2) + ':' + ('00' + Math.round(timeSecond)).slice(-2);
}
function chartView(chartEle, subtitle) {
chart = new Highcharts.Chart({
	chart: {
		renderTo: 'chart',
		zoomType: 'xy'
	},
	title: {
		text: '標高 グラフ',
		style: {
			fontWeight: 'bold'
		}
	},
	subtitle: {
		text: subtitle
	},
	xAxis: {
		type: 'datetime'
	},
	yAxis: [{ // Primary yAxis
		title: {
			text: '標高',
			style: {
				color: '#89A54E'
			}
		},
		labels: {
			formatter: function() {
				return this.value +' m';
			},
			style: {
				color: '#89A54E'
			}
		}
	}],
	tooltip: {
		formatter: function() {
			var dt = Highcharts.dateFormat('%Y-%m-%d %H:%M:%S', this.x);
			var unit = {
				'標高': 'm'
			}[this.series.name];
			return '<b>' + dt +'</b><br><b>'+ this.y + '</b> ' + unit;
		}
	},
	legend: {
		layout: 'vertical',
		align: 'left',
		verticalAlign: 'top',
		floating: true,
		backgroundColor: '#FFFFFF'
	},
	plotOptions: {
		area: {
			fillColor: {
				linearGradient: {x1:0, y1:0, x2:0, y2:1},
				stops: [
					[0, '#89A54E'],
					[1, 'rgba(0,30,0,0)']
				]
			},
			lineWidth: 1,
			marker: {
				enabled: false,
				states: {
					hover: {
						enabled: true,
						radius: 5
					}
				}
			},
			shadow: false,
			states: {
				hover: {
					lineWidth: 1
				}
			},
			threshold: null
		},
		spline: {
			lineWidth: 1,
			marker: {
				enabled: false,
			}
		}
	},
	series: [{
		name: '標高',
		color: '#89A54E',
		type: 'area',
		data: chartEle
	}]
});
}
function winResize() {
	let h = document.documentElement.clientHeight;
	if (chartFlag) {
		document.getElementById('map').style.height = parseInt(h) - 240 + 'px';
	} else {
		document.getElementById('map').style.height = parseInt(h) - 2 + 'px';
	}
}
function chartOff() {
	let h = document.documentElement.clientHeight;
	document.getElementById('map').style.height = parseInt(h) - 2 + 'px';
	document.getElementById('chart').style.display = 'none';
	chartFlag = false;
}
function chartOn() {
	let h = document.documentElement.clientHeight;
	document.getElementById('map').style.height = parseInt(h) - 240 + 'px';
	document.getElementById('chart').style.display = 'block';
	chartFlag = true;
}
