<?php
//	$filepath = '/_attach/gpslog/10010'.'/'.$_GET['gpx'];
	$filepath = 'mygpx'.'/'.$_GET['gpx'];
?>
<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="author" content="晴歩雨描：https://2ndart.hatenablog.com/">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title><?= $_GET['name'] ?></title>
<style>
body { margin:0; padding:0; }
#map {
	width: 100%;
	height: 500px;
}
#chart {
	width: 100%;
	margin: 5px 0 0 0;
	height: 230px;
	display: none;
}
.right-panel {
	font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
	font-size: 12px;
	max-width: 120px;
	overflow-wrap: anywhere;
	margin : 2px 6px;
	padding: 0;
	background: #fff;
}
.panel {
	font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
	font-size: 12px;
	margin : 2px 6px;
	padding: 0;
	background: #fff;
}
.panelDate {
	font-size: 14px;
	font-weight: bold;
}
.panelPlace {
	font-size: 14px;
	font-weight: bold;
}
.timeLavel {
	display: table-cell;
	color: #f00;
	background-color: #ff8;
	opacity: 0.8;
	white-space: nowrap;
	font-size: 12px;
}
</style>
<link rel="stylesheet" href="//unpkg.com/leaflet@1.7.1/dist/leaflet.css" integrity="sha512-xodZBNTC5n17Xt2atTPuE1HxjVMSvLVW9ocqUKLsCC5CXdbqCmblAshOMAS6/keqq/sMZMZ19scR4PsZChSR7A==" crossorigin=""/>
<script src="//unpkg.com/leaflet@1.7.1/dist/leaflet.js" integrity="sha512-XQoYMqMTK8LvdxXYG3nZ448hOEQiglfqkJs1NOQV44cWnUrBc8PkAOcXy20w0vlaXaVUearIOBhiXZ5V3ynxwA==" crossorigin=""></script>
<link rel="stylesheet" href="//use.fontawesome.com/releases/v5.6.3/css/all.css"/>
<link rel="stylesheet" href="css/easy-button.css"/>
<script src="_myhome/easy-button.js"></script>
<script src="//code.highcharts.com/highcharts.js"></script>
<link rel="stylesheet" href="css/leaflet.fullscreen.css"/>
<script src="_myhome/Leaflet.fullscreen.min.js"></script>
<script src="_myhome/my-gpx-2.5-open.js"></script>
</head>
<body>
<div id="container">
	<div id="map"></div>
	<div id="chart"></div>
</div>
<script>
	var request = new XMLHttpRequest();
	request.open('get', '<?= $filepath ?>', false);
	request.send(null);
	gpx2map(request.responseText, false, '<?= $_GET['name'] ?>', 230, 0);
</script>
</body>
</html>
