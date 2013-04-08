var route_list = null;
var hills  = null;
var geo    = null;
var map    = null;

var opt_one  = true;
var opt_zoom = true;
var opt_rich = true;
var marker_rich = null;

var show_comp = true;
var show_inco = false;
var show_unst = false;
var show_hill = true;

var show_html = new Array();
	show_html["comp"] = "";
	show_html["inco"] = "";
	show_html["unst"] = "";
	show_html["hill"] = "";

var kml = new Array();
	kml["hike"]    = true;
	kml["ferry"]   = true;
	kml["todo"]    = true;
	kml["variant"] = true;
	kml["route"]   = true;
	kml["camp"]    = false;
	kml["area"]    = true;
	kml["start"]   = true;
	kml["finish"]  = false;
	kml["extra"]   = false;

var url_base = "web/";

String.prototype.contains = function (key)
{
	return (this.indexOf (key) >= 0);
}

function initialise()
{
	route_list = init_routes();
	var dd = init_dropdown();
	init_options();

	map = map_init();

	geo = new geoXML3.parser ({
		map: map,
		zoom: false,
		singleInfoWindow: true
	});

	marker_rich = map_create_rich();

	show_rich();

	dd.focus();
}


function make_dropdown()
{
	var dd = document.getElementById ("dropdown");
	var value = dd.value;
	var html = '<option value="0">Pick a route...</option>';

	if (show_comp) html += show_html["comp"];
	if (show_inco) html += show_html["inco"];
	if (show_unst) html += show_html["unst"];
	if (show_hill) html += show_html["hill"];

	dd.innerHTML = html;

	// If possible, leave the selection unchanged
	select_dropdown (value);

	return dd;
}

function route_sort(a,b)
{
	if (a.fullname > b.fullname) {
		return 1;
	} else if (a.fullname < b.fullname) {
		return -1;
	} else {
		return 0;
	}
}

function init_dropdown()
{
	var c = new Array();
	var i = new Array();
	var u = new Array();
	var h = new Array();

	var c_html = "";
	var i_html = "";
	var u_html = "";
	var h_html = "";

	for (id in route_list) {
		if ("dist_route" in route_list[id]) {
			if (("complete" in route_list[id]) && (route_list[id].complete == 100)) {
				c.push ({ key: id, fullname: route_list[id].fullname });
			} else if ("date_start" in route_list[id]) {
				i.push ({ key: id, fullname: route_list[id].fullname  + " (" + route_list[id].complete + "%)" });
			} else {
				u.push ({ key: id, fullname: route_list[id].fullname });
			}
		} else {
			h.push ({ key: id, fullname: route_list[id].fullname  + " (" + route_list[id].complete + "%)" });
		}
	}

	c.sort(route_sort);
	i.sort(route_sort);
	u.sort(route_sort);
	h.sort(route_sort);

	if (c.length) {
		c_html += '<optgroup id="complete" label="Complete">';
		for (var j = 0; j < c.length; j++) {
			c_html += '<option value="' + c[j].key +'">' + c[j].fullname + '</option>';
		}
		c_html += '</optgroup>';
	}

	if (i.length) {
		i_html += '<optgroup id="incomplete" label="Incomplete">';
		for (var j = 0; j < i.length; j++) {
			i_html += '<option value="' + i[j].key +'">' + i[j].fullname + '</option>';
		}
		i_html += '</optgroup>';
	}

	if (u.length) {
		u_html += '<optgroup id="unstarted" label="Unstarted">';
		for (var j = 0; j < u.length; j++) {
			u_html += '<option value="' + u[j].key +'">' + u[j].fullname + '</option>';
		}
		u_html += '</optgroup>';
	}

	if (h.length) {
		h_html += '<optgroup id="hills" label="Hills">';
		for (var j = 0; j < h.length; j++) {
			h_html += '<option value="' + h[j].key +'">' + h[j].fullname + '</option>';
		}
		h_html += '</optgroup>';
	}

	show_html["comp"] = c_html;
	show_html["inco"] = i_html;
	show_html["unst"] = u_html;
	show_html["hill"] = h_html;

	return make_dropdown();
}

function init_options()
{
	var t;

	t = document.getElementById ("kml_variant");	t.checked = kml["variant"];
	t = document.getElementById ("kml_hike");	t.checked = kml["hike"];
	t = document.getElementById ("kml_ferry");	t.checked = kml["ferry"];
	t = document.getElementById ("kml_todo");	t.checked = kml["todo"];
	t = document.getElementById ("kml_variant");	t.checked = kml["variant"];
	t = document.getElementById ("kml_route");	t.checked = kml["route"];

	t = document.getElementById ("kml_camp");	t.checked = kml["camp"];
	t = document.getElementById ("kml_area");	t.checked = kml["area"];
	t = document.getElementById ("kml_start");	t.checked = kml["start"];
	t = document.getElementById ("kml_finish");	t.checked = kml["finish"];
	t = document.getElementById ("kml_extra");	t.checked = kml["extra"];

	t = document.getElementById ("opt_one");	t.checked = opt_one;
	t = document.getElementById ("opt_zoom");	t.checked = opt_zoom;
	t = document.getElementById ("opt_rich");	t.checked = opt_rich;

	t = document.getElementById ("show_comp");	t.checked = show_comp;
	t = document.getElementById ("show_inco");	t.checked = show_inco;
	t = document.getElementById ("show_unst");	t.checked = show_unst;
	t = document.getElementById ("show_hill");	t.checked = show_hill;
}


function find_geoxml (url)
{
	var i;

	for (i = 0; i < geo.docs.length; i++) {
		if (geo.docs[i].url == url) {
			return i;
		}
	}

	return -1;
}

function hide_other_routes (route)
{
	var url;
	var index;
	var save_url = get_url (route);
	var dir;

	for (var i = 0; i < geo.docs.length; i++) {
		url = geo.docs[i].url;
		index = url.lastIndexOf ('/');
		dir = url.substr (0, index);

		if (dir == save_url) {
			continue;
		}

		geo.hideDocument (geo.docs[i]);
	}
}

function hide_route (route)
{
	var hide_url = get_url (route);

	var index;
	var dir;

	for (var i = 0; i < geo.docs.length; i++) {
		url = geo.docs[i].url;
		index = url.lastIndexOf ('/');
		dir = url.substr (0, index);

		if (dir == hide_url) {
			geo.hideDocument (geo.docs[i]);
		}
	}
}

function select_dropdown (route)
{
	var dd = document.getElementById ("dropdown");
	for (var i = 0; i < dd.options.length; i++) {
		if (dd.options[i].value == route) {
			dd.options[i].selected = true;
			break;
		}
	}
}

function show_rich()
{
	if (opt_rich) {
		marker_rich.setMap (map);

		if (rich_info.route) {
			// XXX activate current route
			if (opt_one) {
				hide_other_routes (rich_info.route);
			}
			show_kml (rich_info.route, "route");

			// If on a route, zoom to display it
			// XXX enable correct options and select it in the dropdown
			map_zoom_route (rich_info.route);
			select_dropdown (rich_info.route);
		} else {
			// else zoom to current location
			map_zoom_ll (rich_info.latitude, rich_info.longitude, 7);
		}

		// Display infoWindow immediately
		//geo.options.infoWindow.open (map, marker_rich);
	} else {
		marker_rich.setMap (null);
	}

}


function map_create_rich()
{
	var marker = new google.maps.Marker({
		position: new google.maps.LatLng(rich_info.latitude, rich_info.longitude),
		map: map,
		icon: 'rich.png',
		title: "Where's Rich?"
	});

	google.maps.event.addListener(marker, 'click', function() {
		  var message = '<div style="float: left; height: 100%;"><img src="flatcap.png"></div><h1>Rich</h1>' + rich_info.date + ': ' + rich_info.message;
		  geo.options.infoWindow.setContent (message);
		  geo.options.infoWindow.open (map, marker);
	});
}

function map_init()
{
	var my_styles = [
		{ "featureType": "road", "stylers": [ { "visibility": "simplified" } ] },
		{ "featureType": "roads", "elementType": "labels", "stylers": [ { visibility: "off" } ] },
		{ "featureType": "administrative", "elementType": "labels", "stylers": [ { visibility: "on" }, ] },
		{ "featureType": "administrative.country", "stylers": [ { "visibility": "off" } ] }
	];

	var map = new google.maps.Map (document.getElementById ("canvas"), {
		zoom: 6,
		center: new google.maps.LatLng (54.699234, -4.943848),	// UK
		panControl: true,
		zoomControl: true,
		mapTypeControl: true,
		scaleControl: true,
		streetViewControl: false,
		overviewMapControl: false,
		styles: my_styles,
		mapTypeId: google.maps.MapTypeId.SATELLITE		// ROADMAP, TERRAIN, HYBRID, SATELLITE
	});

	// Escape will close the infoWindow
	document.onkeyup = function(e) {
		e = window.event || e;
		if (e.keyCode == 27) {
			geo.options.infoWindow.close();
		}
	}

	return map;
}

function map_zoom_ll (lat, lon, zoom)
{
	if (!lat || !lon || !zoom) {
		return false;
	}

	// bounds of UK
	if ((lat < 49) || (lat > 59)) {
		return false;
	}

	if ((lon < -8) || (lon > 2)) {
		return false;
	}

	map.setCenter (new google.maps.LatLng(lat, lon));
	map.setZoom (zoom);

	return true;
}

function map_zoom_route (route)
{
	var lat;
	var lon;
	var zoom;

	if (route in route_list) {
		lat  = route_list[route].latitude;
		lon  = route_list[route].longitude;
		zoom = route_list[route].zoom;
	}

	if (lat && lon && zoom) {
		map_zoom_ll (lat, lon, zoom);
	} else {
		map_zoom_ll (54.699234, -4.943848, 6);	// UK
	}
}


function on_change_hike (id)
{
	var sel = document.getElementById (id);
	var option = sel.options[sel.selectedIndex].value;

	show_route_new (option);
}

function on_change_kml (id)
{
	var route_key = document.getElementById("dropdown").value;
	var check = document.getElementById(id);

	var name = id.substr (4);

	kml[name] = check.checked;

	show_route_new (route_key);
}

function on_change_opt (id)
{
	var current_route = document.getElementById("dropdown").value;
	var check = document.getElementById(id);

	if (id == "opt_one") {
		opt_one = check.checked;
		if (!opt_one) {
			return;
		}
		hide_other_routes (current_route);
	} else if (id == "opt_zoom") {
		opt_zoom = check.checked;
		if (opt_zoom) {
			map_zoom_route (current_route);
		}
	} else if (id == "opt_rich") {
		opt_rich = !opt_rich;
		show_rich();
	}
}

function on_change_show (id)
{
	switch (id) {
		//XXX need to hide no-longer-displayed routes
		case 'show_comp':
			show_comp = !show_comp;
			if (!show_comp) {
				for (id in route_list) {
					if ("complete" in route_list[id]) {
						if (route_list[id].complete == 100) {
							hide_route (id);
						}
					}
				}
			}
			break;
		case 'show_inco':
			show_inco = !show_inco;
			if (!show_inco) {
				for (id in route_list) {
					if ("complete" in route_list[id]) {
						if (route_list[id].complete < 100) {
							hide_route (id);
						}
					}
				}
			}
			break;
		case 'show_unst':
			show_unst = !show_unst;
			if (!show_unst) {
				for (id in route_list) {
					if (!("date_start" in route_list[id])) {
						hide_route (id);
					}
				}
			}
			break;
		case 'show_hill':
			show_hill = !show_hill;
			if (!show_hill) {
				for (id in hills) {
					hide_route (id);
				}
			}
			break;
	}

	var dd = make_dropdown();

	if (opt_one) {
		hide_other_routes (dd.value);
	}
}

function on_click_global (id)
{
	if (id == "global_centre") {
		map_zoom_route();
		return;
	}

	if (id == "global_clear") {
		var dd = document.getElementById("dropdown");
		dd.value = 0;

		for (var r in route_list) {
			hide_route (r);
		}
		for (var h in hills) {
			hide_route (h);
		}
	}

	if (id == "global_todo") {
		map_zoom_route();
		var todo = [
			// XXX move out to json
			"west.somerset.coast",
			"river.parrett",
			"offas.dyke",
			"wales.coast",
			"sefton.coast",
			"lancashire.coast",
			"cumbria.coast",
			"hadrians.wall",
			"northumberland.coast",
			"southern.upland.way",
			"mull.of.galloway.trail",
			"ayrshire.coast",
			"five.degrees.west"
		];

		for (var i = 0; i < todo.length; i++) {
			show_kml (todo[i], "route");
		}

		return;
	}

	if (id == "global_done") {
		map_zoom_route();
		for (var r in route_list) {
			if (route_list[r].complete > 0) {
				show_kml (r, "hike");
			}
		}
		for (var h in hills) {
			if (hills[h].complete > 0) {
				show_kml (h, "area_done");
				show_kml (h, "hills_done");
			}
		}
	}
}


function show_route_new (route)
{
	if (!(route in route_list)) {
		return;
	}

	if (opt_one) {
		hide_other_routes (route);
	}

	var attr  = route_list[route].attr;
	var hill  = !("dist_route" in route_list[route]);
	var extra = (!hill) || (kml["extra"] == true);
	var hike  = false;
	var todo  = false;
	var ferry = false;
	var walked = false;

	if ((kml["start"] == true) && attr.contains ('s')) {
		show_kml (route, "start");
	} else {
		hide_kml (route, "start");
	}

	if ((kml["finish"] == true) && attr.contains ('e')) {
		show_kml (route, "finish");
	} else {
		hide_kml (route, "finish");
	}

	if (hill) {
		if ((kml["hike"] == true) && attr.contains ('P')) {
			show_kml (route, "hills_done");
		} else {
			hide_kml (route, "hills_done");
		}

		if ((kml["todo"] == true) && attr.contains ('p')) {
			show_kml (route, "hills_todo");
		} else {
			hide_kml (route, "hills_todo");
		}

		if ((kml["area"] == true) && kml["hike"] && attr.contains ('A')) {
			show_kml (route, "area_done");
		} else {
			hide_kml (route, "area_done");
		}

		if ((kml["area"] == true) && kml["todo"] && attr.contains ('a')) {
			show_kml (route, "area_todo");
		} else {
			hide_kml (route, "area_todo");
		}
	} else {
		if ((kml["variant"] == true) && attr.contains ('v')) {
			show_kml (route, "variant");
		} else {
			hide_kml (route, "variant");
		}
	}

	if ((kml["extra"] == true) && attr.contains ('x')) {
		// show extras
	} else {
		// hide extras
	}

	if ((kml["camp"] == true) && attr.contains ('c') && extra) {
		show_kml (route, "camp");
	} else {
		hide_kml (route, "camp");
	}

	if ((kml["hike"] == true) && attr.contains ('h') && extra) {
		show_kml (route, "hike");
		hike = true;
	} else {
		hide_kml (route, "hike");
	}

	if ((kml["todo"] == true) && attr.contains ('t') && extra) {
		show_kml (route, "todo");
		todo = true;
	} else {
		hide_kml (route, "todo");
	}

	if ((kml["ferry"] == true) && attr.contains ('f') && extra) {
		show_kml (route, "ferry");
		ferry = true;
	} else {
		hide_kml (route, "ferry");
	}

	walked = hike || todo || ferry;

	if ((kml["route"] == true) && attr.contains ('r') && (!walked)) {
		show_kml (route, "route");
	} else {
		hide_kml (route, "route");
	}

	if (opt_zoom) {
		map_zoom_route (route);
	}
}

function get_url (route, type)
{
	var url = url_base + route;
	
	if (type)
		url += "/" + type + ".kml";

	return url;
}

function show_kml (route, type)
{
	var url = get_url (route, type);
	var i = find_geoxml (url);
	if (i >= 0) {
		geo.showDocument (geo.docs[i]);
	} else {
		geo.parse (url);
	}
}

function hide_kml (route, type)
{
	var url = get_url (route, type);
	var i = find_geoxml (url);
	if (i >= 0) {
		geo.hideDocument (geo.docs[i]);
	}
}


