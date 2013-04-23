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
			// Show list of:
var show_comp   = true;		// Completed routes
var show_inco   = true;		// Incomplete routes
var show_unst   = false;	// Unstarted routes
var show_hill   = true;		// Sets of hills

var show_html = new Array();	// Keep the select HTML to rebuild the dropdown
	show_html["comp"] = "";		// Completed routes
	show_html["inco"] = "";		// Incomplete routes
	show_html["unst"] = "";		// Unstarted routes
	show_html["hill"] = "";		// Sets of hills

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

var url_base = "routes/";			// Directory containing kml data

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
		marker_rich.setMap (map);

		if (rich_info.route) {
			if (opt_one) {
				hide_other_routes (rich_info.route);
			}
			show_route (rich_info.route);

			// If on a route, zoom to display it
			// XXX enable correct options and select it in the dropdown
			map_zoom_route (rich_info.route);
			dd_select (rich_info.route);
		} else {
			// otherwise zoom to current location
			map_zoom_ll (rich_info.latitude, rich_info.longitude, 7);
		}

		// Display infoWindow immediately
		geo.options.infoWindow.open (map, marker_rich);
	} else {
		marker_rich.setMap (null);
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

	var c_html = "";
	var i_html = "";
	var u_html = "";
	var h_html = "";

	for (var r in route_list) {
		if (("dist_route" in route_list[r]) && (route_list[r].dist_route > 0)) {
			if ("complete" in route_list[r]) {
				if (route_list[r].complete == 100) {
					c.push ({ key: r, fullname: route_list[r].fullname });
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
 */
function create_message()
{
	var m = "";
	var e;
	var today = new Date();

	m += '<img style="float: left;" src="flatcap.png">';
	m += '<div style="margin-left: 70px;">';
	m += '<h2>Rich</h2>';

	m += '<span class="subtle">(last seen ';
	e = today.diff (rich_info.date_seen);
	if (e < 1) {
		m += "today";
	} else if (e < 2) {
		m += "yesterday";
	} else if (e < 8) {
		m += e + " days ago";
	} else {
		m += "on " + rich_info.date_seen;
	}
	m += ')</span><br><br>';

	if (rich_info.route) {
		if (rich_info.date_route) {
			var d = today.diff (rich_info.date_route) + 1;
			m += '<b>Day ' + d + '</b> of the <b>' + route_list[rich_info.route].fullname + '</b>';

			if (rich_info.percentage) {
				m += " (~" + rich_info.percentage + "%)";
			}
		} else {
			m += 'Walking the <b>' + route_list[rich_info.route].fullname + '</b>';
		}
		m += '<br>';
	} else {
		m += 'Not currently on a route<br>';
	}

	if (rich_info.latitude && rich_info.longitude) {
		var lat = parseFloat (rich_info.latitude);
		var lon = parseFloat (rich_info.longitude);
		m += '<span class="subtle">lat/long: ' + lat.toFixed(6) + ',' + lon.toFixed(6) + '</span><br>';
	}

	m += '<br>';

	e = today.diff (rich_info.date_bed);
	if (e > 7) {
		m += 'Last saw a bed ' + e + ' days ago.<br><br>';
	}

	if (rich_info.message) {
		m += '<b>&ldquo;' + rich_info.message + '&rdquo;</b>';
	}

	m += '</div>';
	return m;
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
	var marker = new google.maps.Marker({
		position: new google.maps.LatLng(rich_info.latitude, rich_info.longitude),
		map: map,
		icon: 'rich.png',
		title: "Where's Rich?"
	});

	google.maps.event.addListener(marker, 'click', function() {
		var message = create_message();

		geo.options.infoWindow.setContent (message);
		geo.options.infoWindow.open (map, marker);
	});

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
	document.onkeyup = function(e) {
		e = window.event || e;
		if (e.keyCode == 27) {
			geo.options.infoWindow.close();
		}
	}

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
		map_zoom_ll (54.699234, -4.943848, 6);	// UK
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
	}

	var dd = dd_populate();

	for (var r in route_list) {
		if (!show_comp && ("complete" in route_list[r]) && (route_list[r].complete == 100)) {
			hide_route (r);
		}
		if (!show_inco && ("complete" in route_list[r]) && (route_list[r].complete < 100)) {
			hide_route (r);
		}
		if (!show_unst && !("date_start" in route_list[r])) {
			hide_route (r);
		}
		if (!show_hill) {
			hide_route (r);
		}
	}

	if (opt_one) {
		hide_other_routes (dd.value);
	}
}

