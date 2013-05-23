/**
 * Copyright (c) 2013 Richard Russon (flatcap)
 *
 * This program is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation; either version 3 of the License, or (at your option)
 * any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * this program. If not, see http://www.gnu.org/licenses/
 */

var route_list  = null;		// Array of all route data
var geo         = null;		// geoXML3 helper
var map         = null;		// Google map
			// Options:
var opt_one     = true;		// Only show one route at a time
var opt_zoom    = true;		// Zoom in to the current route
var opt_rich    = true;		// Show Rich's location
var marker_rich = null;		// Google map marker showing Rich's location
var marker_esti = null;		// ... showing Rich's estimate location
			// Show list of:
var show_comp   = true;		// Completed routes
var show_inco   = true;		// Incomplete routes
var show_unst   = false;	// Unstarted routes
var show_hill   = true;		// Sets of hills
var show_join   = true;		// Non-route joins

var show_html = new Array();	// Keep the select HTML to rebuild the dropdown
	show_html["comp"] = "";		// Completed routes
	show_html["inco"] = "";		// Incomplete routes
	show_html["unst"] = "";		// Unstarted routes
	show_html["hill"] = "";		// Sets of hills
	show_join["join"] = "";		// Non-route joins

var kml = new Array();		// Display:
	kml["hike"]    = true;		// Hikes or Climbed hills
	kml["ferry"]   = true;		// River crossings
	kml["todo"]    = true;		// Incomplete route sections
	kml["variant"] = true;		// Variant routes, or detours
	kml["route"]   = true;		// Official route
	kml["camp"]    = false;		// Overnight stops
	kml["area"]    = true;		// Region of hill set
	kml["start"]   = true;		// Marker showing start of route
	kml["end"]     = false;		// Marker showing end of route
	kml["extra"]   = false;		// Custom data for route

var url_base = "routes/";	// Directory containing kml data

/**
 * String.contains - Does the string contain this character
 * @key: Character to look for
 *
 * Extend the String class with a "contains" method.
 * Search the string for a given character.
 *
 * Return: bool
 */
String.prototype.contains = function (key)
{
	return (this.indexOf (key) >= 0);
}

/**
 * Date.diff - Compare two dates
 * @str: Date in any date(1) format
 *
 * Compare a string against this date.
 *
 * Return: n Difference in days
 */
Date.prototype.diff = function (str)
{
	var d = new Date(str);

	return Math.floor ((this - d) / 86400000);
}

/**
 * initialise - Start up
 *
 * Set up the Google map, dropdown and geoXML3 helper.
 * Set checkboxes to their defaults.
 */
function initialise()
{
	route_list = init_routes();
	var dd = dd_init();
	init_options();

	map = map_init();

	geo = new geoXML3.parser ({
		map: map,
		zoom: false,
		singleInfoWindow: true
	});

	marker_rich = map_create_rich();
	marker_esti = map_create_estimate();

	show_rich();

	dd.focus();
}


/**
 * route_sort - Sort two route_list items by fullname
 * @a: Item 1
 * @b: Item 2
 *
 * Sort helper function.
 * Sort the route_list by fullname.
 *
 * Return:	-1	a precedes b
 *		 0	a identical to b
 *		 1	a follows b
 */
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

/**
 * init_options - Set the default checkbox values
 *
 * Set some sensible defaults for the checkboxes.
 */
function init_options()
{
	document.getElementById ("kml_variant")	.checked = kml["variant"];
	document.getElementById ("kml_hike")	.checked = kml["hike"];
	document.getElementById ("kml_ferry")	.checked = kml["ferry"];
	document.getElementById ("kml_todo")	.checked = kml["todo"];
	document.getElementById ("kml_variant")	.checked = kml["variant"];
	document.getElementById ("kml_route")	.checked = kml["route"];

	document.getElementById ("kml_camp")	.checked = kml["camp"];
	document.getElementById ("kml_area")	.checked = kml["area"];
	document.getElementById ("kml_start")	.checked = kml["start"];
	document.getElementById ("kml_end")	.checked = kml["end"];
	document.getElementById ("kml_extra")	.checked = kml["extra"];

	document.getElementById ("opt_one")	.checked = opt_one;
	document.getElementById ("opt_zoom")	.checked = opt_zoom;
	document.getElementById ("opt_rich")	.checked = opt_rich;

	document.getElementById ("show_comp")	.checked = show_comp;
	document.getElementById ("show_inco")	.checked = show_inco;
	document.getElementById ("show_unst")	.checked = show_unst;
	document.getElementById ("show_hill")	.checked = show_hill;
	document.getElementById ("show_join")	.checked = show_join;
}


/**
 * find_geoxml - Find the geoXML3 document by its url
 * @url: url of kml document
 *
 * Return:	 n	Index in docs array
 *		-1	url doesn't exist
 */
function find_geoxml (url)
{
	for (var i = 0; i < geo.docs.length; i++) {
		if (geo.docs[i].url == url) {
			return i;
		}
	}

	return -1;
}

/**
 * hide_other_routes - Hide all routes but this one
 * @route: Route name
 *
 * Hide all the components of all the routes except this one.
 */
function hide_other_routes (route)
{
	var save_url = get_url (route);
	var url;
	var index;
	var dir;

	for (var i = 0; i < geo.docs.length; i++) {
		url = geo.docs[i].url;
		index = url.lastIndexOf ('/');
		dir = url.substr (0, index);

		if (dir != save_url) {
			geo.hideDocument (geo.docs[i]);
		}
	}
}

/**
 * hide_route - Hide this route
 * @route: Route name
 *
 * Hide all the components of this route.
 */
function hide_route (route)
{
	var hide_url = get_url (route);
	var url;
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

/**
 * show_rich - Place a marker where Rich was last seen
 *
 * Using the data in rich.json, place a marker on the map.
 *
 * rich.json contains:
 *	date:		Date (yyyy-mm-dd), last seen
 *	latitude:	Degrees latitude (decimal)
 *	longitude:	Degrees longitude (decimal)
 *	message:	Message (can contain html)
 *	route:		Current route
 */
function show_rich()
{
	// rich_info is from rich.json
	if (opt_rich) {
		if (marker_rich)
			marker_rich.setMap (map);
		if (marker_esti)
			marker_esti.setMap (map);

		if (rich_info.route) {
			if (opt_one) {
				hide_other_routes (rich_info.route);
			}
			show_route (rich_info.route);

			// If on a route, zoom to display it
			if (opt_zoom) {
				map_zoom_route (rich_info.route);
			}
			// XXX enable correct options and select it in the dropdown
			dd_select (rich_info.route);

			// Display infoWindow immediately
			if (marker_esti) {
				map_marker_display_estimate();
			} else {
				map_marker_display_rich();
			}
		} else {
			// otherwise zoom to current location
			map_zoom_ll (rich_info.latitude, rich_info.longitude, 7);
		}
	} else {
		if (marker_rich)
			marker_rich.setMap (null);
		if (marker_esti)
			marker_esti.setMap (null);
	}
}

/**
 * show_route - Display/hide a route on the map
 * @route: Route name
 *
 * For a given route, display its data on the map.
 * Take into account the global options kml[*].
 *
 * route_list[@route].attr tells us what kml exists.
 * kml[*] tells us what the use wants displayed.
 *
 * Use show_kml(), hide_kml() to do the work.
 */
function show_route (route)
{
	if (!(route in route_list)) {
		return;
	}

	if (opt_one) {
		hide_other_routes (route);
	}

	var attr  = route_list[route].attr;
	var hill  = !(("dist_route" in route_list[route]) && (route_list[route].dist_route > 0));
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

	if ((kml["end"] == true) && attr.contains ('e')) {
		show_kml (route, "end");
	} else {
		hide_kml (route, "end");
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

	if (attr.contains ('x') && ("custom" in route_list[route])) {
		var list = route_list[route].custom.split(',');
		if (kml["extra"] == true) {
			for (var i = 0; i < list.length; i++) {
				show_kml (route, list[i]);
			}
		} else {
			for (var i = 0; i < list.length; i++) {
				hide_kml (route, list[i]);
			}
		}
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

/**
 * get_url - Get the location of the kml for a route
 * @route: Route name
 * @type: Data type, e.g. "hike"
 *
 * Create a url from the base directory and the route's name and type.
 *
 * Return: url of route
 */
function get_url (route, type)
{
	var url = url_base + route;

	if (type) {
		url += "/" + type + ".kml";
	}

	return url;
}

/**
 * show_kml - Display one kml on the map
 * @route: Route name
 * @type: Data type, e.g. "hike"
 *
 * Load and display one kml file on the map.
 */
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

/**
 * hide_kml - Hide one piece of route data
 * @route: Route name
 * @type: Data type, e.g. "hike"
 *
 * Hide one element of one route on the map.
 */
function hide_kml (route, type)
{
	var url = get_url (route, type);
	var i = find_geoxml (url);
	if (i >= 0) {
		geo.hideDocument (geo.docs[i]);
	}
}

/**
 * estimate_exists - Is there valid estimate data?
 *
 * Return: boolean
 */
function estimate_exists()
{
	if (typeof estimate_info === 'undefined')
		return false;

	return (("wp"         in estimate_info) &&
		("percentage" in estimate_info) &&
		("latitude"   in estimate_info) &&
		("longitude"  in estimate_info))
}


/**
 * dd_init - Create HTML for dropdown
 *
 * Create the HTML for the dropdown from the route_list.
 *
 * Return: DOM select object
 */
function dd_init()
{
	var c = new Array();
	var i = new Array();
	var u = new Array();
	var h = new Array();
	var j = new Array();

	var c_html = "";
	var i_html = "";
	var u_html = "";
	var h_html = "";
	var j_html = "";

	for (var r in route_list) {
		if (("dist_route" in route_list[r]) && (route_list[r].dist_route > 0)) {
			if ("complete" in route_list[r]) {
				if (route_list[r].complete == 100) {
					var attr = route_list[r].attr;
					if (attr.contains ('r')) {
						c.push ({ key: r, fullname: route_list[r].fullname });
					} else {
						j.push ({ key: r, fullname: route_list[r].fullname });
					}
				} else if (route_list[r].complete > 0) {
					i.push ({ key: r, fullname: route_list[r].fullname  + " (" + route_list[r].complete + "%)" });
				} else {
					u.push ({ key: r, fullname: route_list[r].fullname });
				}
			}
		} else {
			h.push ({ key: r, fullname: route_list[r].fullname  + " (" + route_list[r].complete + "%)" });
		}
	}

	c.sort(route_sort);
	i.sort(route_sort);
	u.sort(route_sort);
	h.sort(route_sort);
	j.sort(route_sort);

	if (c.length) {
		c_html += '<optgroup id="complete" label="Complete">';
		for (var x = 0; x < c.length; x++) {
			c_html += '<option value="' + c[x].key +'">' + c[x].fullname + '</option>';
		}
		c_html += '</optgroup>';
	}

	if (i.length) {
		i_html += '<optgroup id="incomplete" label="Incomplete">';
		for (var x = 0; x < i.length; x++) {
			i_html += '<option value="' + i[x].key +'">' + i[x].fullname + '</option>';
		}
		i_html += '</optgroup>';
	}

	if (u.length) {
		u_html += '<optgroup id="unstarted" label="Unstarted">';
		for (var x = 0; x < u.length; x++) {
			u_html += '<option value="' + u[x].key +'">' + u[x].fullname + '</option>';
		}
		u_html += '</optgroup>';
	}

	if (h.length) {
		h_html += '<optgroup id="hills" label="Hills">';
		for (var x = 0; x < h.length; x++) {
			h_html += '<option value="' + h[x].key +'">' + h[x].fullname + '</option>';
		}
		h_html += '</optgroup>';
	}

	if (j.length) {
		j_html += '<optgroup id="join" label="Join Ups">';
		for (var x = 0; x < j.length; x++) {
			j_html += '<option value="' + j[x].key +'">' + j[x].fullname + '</option>';
		}
		j_html += '</optgroup>';
	}

	show_html["comp"] = c_html;
	show_html["inco"] = i_html;
	show_html["unst"] = u_html;
	show_html["hill"] = h_html;
	show_html["join"] = j_html;

	return dd_populate();
}

/**
 * dd_populate - Populate the dropdown box
 *
 * Dropdown contents depend on four bools (show_*).
 * After the rebuild, try to keep the previous selected item.
 *
 * Return: DOM select object
 */
function dd_populate()
{
	var dd = document.getElementById ("dropdown");
	var value = dd.value;
	var html = "";

	if (show_comp) html += show_html["comp"];
	if (show_inco) html += show_html["inco"];
	if (show_unst) html += show_html["unst"];
	if (show_hill) html += show_html["hill"];
	if (show_join) html += show_html["join"];

	dd.innerHTML = html;

	// If possible, leave the selection unchanged
	dd_select (value);

	return dd;
}

/**
 * dd_select - Pick a dropdown entry by value
 * @route: Name of the route
 *
 * Select entry in dropdown by route name
 */
function dd_select (route)
{
	var dd = document.getElementById ("dropdown");
	for (var i = 0; i < dd.options.length; i++) {
		if (dd.options[i].value == route) {
			dd.options[i].selected = true;
			break;
		}
	}
}


/**
 * create_message - Create the popup message
 *
 * Create the "Where's Rich" popup message
 */
function create_message(estimate)
{
	var message = "";
	var elapsed = 0;
	var today = new Date();
	var since = null;

	var latitude   = 0;
	var longitude  = 0;
	var percentage = 0;

	if (!estimate_exists())
		estimate = false;

	if (estimate) {
		since = today;
	} else {
		since = new Date(rich_info.date_seen);
	}

	message += '<img style="float: left;" src="flatcap.png">';
	message += '<div style="margin-left: 70px;">';
	message += '<h2>Rich';

	if (estimate) {
		message += ' <span class="estimate">(estimated position)</span>';
	} else {
		message += ' <span class="lastseen">(last seen ';
		elapsed = today.diff (rich_info.date_seen);
		if (elapsed < 1) {
			message += "today";
		} else if (elapsed < 2) {
			message += "yesterday";
		} else if (elapsed < 8) {
			message += elapsed + " days ago";
		} else {
			message += "on " + rich_info.date_seen;
		}
		message += ')</span>';
	}
	message += '<br><br></h2>';

	if (estimate) {
		percentage = estimate_info.percentage;
		latitude   = estimate_info.latitude;
		longitude  = estimate_info.longitude;
	} else {
		percentage = rich_info.percentage;
		latitude   = rich_info.latitude;
		longitude  = rich_info.longitude;
	}

	if (rich_info.route) {
		if (rich_info.date_route) {
			var d = since.diff (rich_info.date_route) + 1;
			message += '<b>Day ' + d + '</b> of the <b>' + route_list[rich_info.route].fullname + '</b>';

			if (percentage) {
				message += " (" + percentage + "%)";
			}
		} else {
			message += 'Walking the <b>' + route_list[rich_info.route].fullname + '</b>';
		}
		message += '<br>';
	} else {
		message += 'Not currently on a route<br>';
	}

	if (latitude && longitude) {
		var lat = parseFloat (latitude);
		var lon = parseFloat (longitude);
		message += '<span class="subtle">lat/long: ' + lat.toFixed(6) + ',' + lon.toFixed(6) + '</span><br>';
	}

	message += '<br>';

	elapsed = since.diff (rich_info.date_bed);
	if (elapsed > 7) {
		message += 'Last saw a bed ' + elapsed + ' days ago.<br><br>';
	}

	if (rich_info.message) {
		message += '<b>&ldquo;' + rich_info.message + '&rdquo;</b>';
	}

	message += '</div>';
	return message;
}

/**
 * map_marker_display_rich - Show the popup message
 *
 * Display where Rich was last seen.
 */
function map_marker_display_rich()
{
	var message = create_message(false);

	geo.options.infoWindow.setContent (message);
	geo.options.infoWindow.open (map, marker_rich);
}

/**
 * map_marker_display_estimate - Show the popup message
 *
 * Display the "Where's Rich" popup message.
 */
function map_marker_display_estimate()
{
	if (!marker_esti)
		return;

	var message = create_message(true);

	geo.options.infoWindow.setContent (message);
	geo.options.infoWindow.open (map, marker_esti);
}

/**
 * map_create_rich - Create a Google.maps.Marker
 *
 * Create a marker to show Rich's location.
 * Data comes from rich.json (see show_rich() for details).
 */
function map_create_rich()
{
	// rich_info is from rich.json
	marker = new google.maps.Marker({
		position: new google.maps.LatLng(rich_info.latitude, rich_info.longitude),
		map: map,
		icon: 'r_green.png',
		title: "Where's Rich?"
	});

	google.maps.event.addListener(marker, 'click', map_marker_display_rich);

	return marker;
}

/**
 * map_create_estimate - Create a Google.maps.Marker
 *
 * Create a marker to show Rich's estimated location.
 *
 * estimate_info.json contains:
 *	wp:		Waypoint number
 *	percentage:	Percentage complete
 *	latitude:	Degrees latitude (decimal)
 *	longitude:	Degrees longitude (decimal)
 */
function map_create_estimate()
{
	if (!estimate_exists())
		return null;

	// estimate_info is from estimate.json
	marker = new google.maps.Marker({
		position: new google.maps.LatLng(estimate_info.latitude, estimate_info.longitude),
		map: map,
		icon: 'r_yellow.png',
		title: "Where's Rich?"
	});

	google.maps.event.addListener(marker, 'click', map_marker_display_estimate);

	return marker;
}

/**
 * map_init - Create a Google map
 *
 * Create and style a Google map.
 * When the user presses <Esc>, close the map's infoWindow
 */
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
		mapTypeId: google.maps.MapTypeId.SATELLITE	// ROADMAP, TERRAIN, HYBRID, SATELLITE
	});

	// Escape will close the infoWindow
	document.onkeydown = function(e) {
		e = window.event || e;
		switch (e.keyCode) {
			case 27:	// Escape
				geo.options.infoWindow.close();
				e.preventDefault();
				break;
			case 61:	// +
			case 107:	// KP+
				map.setZoom(map.getZoom()+1);
				e.preventDefault();
				break;
			case 173:	// -
			case 109:	// KP-
				map.setZoom(map.getZoom()-1);
				e.preventDefault();
				break;
			case 37:	// Left arrow
				map.panBy(-100,0);
				e.preventDefault();
				break;
			case 38:	// Up arrow
				map.panBy(0,-100);
				e.preventDefault();
				break;
			case 39:	// Right arrow
				map.panBy(100,0);
				e.preventDefault();
				break;
			case 40:	// Down arrow
				map.panBy(0,100);
				e.preventDefault();
				break;
			/*
			default:
				var c = document.getElementById ("coords");
				c.innerHTML = e.keyCode;
				break;
			*/
		}
	}

	google.maps.event.addListener(map, 'click', function(event) {
		var c = document.getElementById ("coords");
		var lat = event.latLng.lat().toFixed(6);
		var lon = event.latLng.lng().toFixed(6);
		c.innerHTML = lat + "," + lon + " (" + map.getZoom() + ")";
	});

	return map;
}

/**
 * map_zoom_ll - Zoom in on coordinates
 * @lat: Latitude
 * @lon: Longitude
 * @zoom: Zoom level (1 = From space, 17 = grass level)
 *
 * Centre the map on the coordinates: (@lat, @lon).
 * Zoom in to the level @zoom.
 */
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

/**
 * map_zoom_route - Frame a route in the map
 * @route: Route name
 *
 * Centre the map on @route and zoom in.
 * The data come from:
 *	route_list[@route].latitude
 *	route_list[@route].longitude
 *	route_list[@route].zoom
 */
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
		map_zoom_ll (54.699234, -3.143848, 6);	// UK
	}
}


/**
 * on_global - Event hander for buttons
 * @id: ID of button
 *
 * Perform some global actions on the map.
 */
function on_global (id)
{
	switch (id) {
		case "global_centre":
			map_zoom_route();
			break;

		case "global_clear":
			var dd = document.getElementById("dropdown");
			dd.selectedIndex = -1;
			for (var r in route_list) {
				hide_route (r);
			}
			break;

		case "global_todo":
			if (opt_zoom) {
				map_zoom_route();
			}
			// todo_list is from todo.json
			for (var i = 0; i < todo_list.length; i++) {
				show_kml (todo_list[i], "route");
			}
			break;

		case "global_done":
			if (opt_zoom) {
				map_zoom_route();
			}
			for (var r in route_list) {
				if (route_list[r].complete > 0) {
					show_kml (r, "hike");
				}
			}
			break;
	}
}

/**
 * on_hike - Event handler for hike dropdown
 * @id: ID of dropdown
 *
 * When the user selects a different hike, display it.
 */
function on_hike (id)
{
	var sel = document.getElementById (id);
	var option = sel.options[sel.selectedIndex].value;

	show_route (option);
}

/**
 * on_kml - Event handler for kml display options
 * @id: ID of checkbox
 *
 * When the user changes a kml display option update the routes
 * shown on the map accordinly.
 */
function on_kml (id)
{
	var route_key = document.getElementById("dropdown").value;
	var check = document.getElementById(id);

	var name = id.substr (4);

	kml[name] = check.checked;

	show_route (route_key);
}

/**
 * on_opt - Event handler for global options
 * @id: ID of checkbox
 *
 * When the user changes any of the global map options, update
 * the display of the route(s) accordingly.
 */
function on_opt (id)
{
	var current_route = document.getElementById("dropdown").value;
	var check = document.getElementById(id);

	if (id == "opt_one") {
		opt_one = check.checked;
		if (opt_one) {
			hide_other_routes (current_route);
		}
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

/**
 * on_show - Event hander for route list display options
 * @id: ID of checkbox
 *
 * Toggle whether a class of routes is displayed in the dropdown.
 * The use can choose any, or none of:
 *	Completed routes
 *	Incomplete routes
 *	Unstarted routes
 *	Sets of hills
 */
function on_show (id)
{
	switch (id) {
		case 'show_comp': show_comp = !show_comp; break;
		case 'show_inco': show_inco = !show_inco; break;
		case 'show_unst': show_unst = !show_unst; break;
		case 'show_hill': show_hill = !show_hill; break;
		case 'show_join': show_join = !show_join; break;
	}

	var dd = dd_populate();

	for (var r in route_list) {
		var complete = 0;
		var dist_route = 0;
		var route = false;
		var attr = route_list[r].attr;

		if ("complete" in route_list[r]) {
			complete = route_list[r].complete;
		}
		if ("dist_route" in route_list[r]) {
			dist_route = route_list[r].dist_route;
		}
		if (attr.contains ('r')) {
			route = true;
		}

		if (!show_comp && route && (complete == 100)) {
			hide_route (r);
		}
		if (!show_inco && route && (complete < 100)) {
			hide_route (r);
		}
		if (!show_unst && route && (complete == 0)) {
			hide_route (r);
		}
		if (!show_join && !route && (complete == 100) && (dist_route > 0)) {
			hide_route (r);
		}
		if (!show_hill && !route && (dist_route == 0)) {
			hide_route (r);
		}
	}

	if (opt_one) {
		hide_other_routes (dd.value);
	}
}

