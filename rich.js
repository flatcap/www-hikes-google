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
	init_routes();
	init_dropdown();
	init_options();

	map = map_init();

	geo = new geoXML3.parser ({
		map: map,
		zoom: false,
		singleInfoWindow: true
	});

	var dd = document.getElementById("dropdown");
	dd.value = "0";
	dd.focus();

	show_rich();

	document.onkeyup = function(e) {
		e = window.event || e;
		if (e.keyCode == 27) {
			geo.options.infoWindow.close();
		}
	}
}


function make_dropdown (selection)
{
	var dd = document.getElementById ("dropdown");
	var html = '<option value="0">Pick a route...</option>';

	if (show_comp) html += show_html["comp"];
	if (show_inco) html += show_html["inco"];
	if (show_unst) html += show_html["unst"];
	if (show_hill) html += show_html["hill"];

	dd.innerHTML = html;
	dd.value = selection;
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

	make_dropdown (0);
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

function init_routes()
{
	route_list = {
		// Complete routes
		"coast.to.coast" : {
			"fullname"	: "Coast to Coast",
			"name"		: "Coast to Coast",
			"attr"		: "cehrs",
			"dist_route"	: 184.2,
			"date_start"	: "2012-09-28",
			"date_end"	: "2012-10-10",
			"days_walked"	: 13,
			"days_camped"	: 10,
			"days_other"	: 3,
			"dist_walked"	: 194.0,
			"complete"	: 100,
			"latitude"	: 54.425322,
			"longitude"	: -2.032471,
			"zoom"		: 8
		},
		"e2" : {
			"fullname"	: "E2 Dover to Kirk Yetholm",
			"name"		: "E2",
			"attr"		: "cehrstv",
			"dist_route"	: 684.0,
			"date_start"	: "2010-09-22",
			"date_end"	: "2013-02-23",
			"days_walked"	: 40,
			"days_camped"	: 33,
			"days_other"	: 4,
			"dist_walked"	: 721.0,
			"complete"	: 100,
			"latitude"	: 53.225768,
			"longitude"	: -0.681152,
			"zoom"		: 6
		},
		"e9" : {
			"fullname"	: "E9 Dover to Plymouth",
			"name"		: "E9",
			"attr"		: "cefhrsv",
			"dist_route"	: 440.0,
			"date_start"	: "2012-06-13",
			"date_end"	: "2013-01-12",
			"days_walked"	: 24,
			"days_camped"	: 18,
			"days_other"	: 4,
			"dist_walked"	: 464.0,
			"complete"	: 100,
			"latitude"	: 50.590212,
			"longitude"	: -1.450195,
			"zoom"		: 7
		},
		"isle.of.wight.coast" : {
			"fullname"	: "Isle of Wight Coastal Path",
			"name"		: "Isle of Wight Coast",
			"attr"		: "cehrs",
			"dist_route"	: 68.7,
			"date_start"	: "2012-12-30",
			"date_end"	: "2013-01-02",
			"days_walked"	: 3,
			"days_camped"	: 3,
			"days_other"	: 0,
			"dist_walked"	: 70.0,
			"complete"	: 100,
			"latitude"	: 50.670789,
			"longitude"	: -1.321793,
			"zoom"		: 11
		},
		"kent.coast" : {
			"fullname"	: "Kent Coast Path",
			"name"		: "Kent Coast",
			"attr"		: "cehrsv",
			"dist_route"	: 207.0,
			"date_start"	: "2013-01-11",
			"date_end"	: "2013-01-21",
			"days_walked"	: 10,
			"days_camped"	: 8,
			"days_other"	: 1,
			"dist_walked"	: 211.0,
			"complete"	: 100,
			"latitude"	: 51.198279,
			"longitude"	: 0.832214,
			"zoom"		: 9
		},
		"north.downs" : {
			"fullname"	: "North Downs Way &mdash; National Trail",
			"name"		: "North Downs",
			"attr"		: "cehrsv",
			"dist_route"	: 125.1,
			"date_start"	: "2013-01-12",
			"date_end"	: "2013-02-08",
			"days_walked"	: 7,
			"days_camped"	: 5,
			"days_other"	: 1,
			"dist_walked"	: 132.0,
			"complete"	: 100,
			"latitude"	: 51.063839,
			"longitude"	: 0.285645,
			"zoom"		: 9
		},
		"oxford.green.belt" : {
			"fullname"	: "Oxford Green Belt Way",
			"name"		: "Oxford Green Belt",
			"attr"		: "cehrs",
			"dist_route"	: 52.1,
			"date_start"	: "2013-02-24",
			"date_end"	: "2013-03-07",
			"days_walked"	: 4,
			"days_camped"	: 2,
			"days_other"	: 0,
			"dist_walked"	: 57.1,
			"complete"	: 100,
			"latitude"	: 51.743612,
			"longitude"	: -1.208496,
			"zoom"		: 11
		},
		"pennine.way" : {
			"fullname"	: "Pennine Way &mdash; National Trail",
			"name"		: "Pennine Way",
			"attr"		: "cehrs",
			"dist_route"	: 255.0,
			"date_start"	: "2010-09-20",
			"date_end"	: "2012-10-18",
			"days_walked"	: 16,
			"days_camped"	: 14,
			"days_other"	: 3,
			"dist_walked"	: 269.0,
			"complete"	: 100,
			"latitude"	: 53.994854,
			"longitude"	: -0.769043,
			"zoom"		: 7
		},
		"snowdon.horseshoe" : {
			"fullname"	: "Snowdon Horseshoe",
			"name"		: "Snowdon Horseshoe",
			"attr"		: "ehrs",
			"dist_route"	: 7.4,
			"date_start"	: "2005-08-20",
			"date_end"	: "2005-08-20",
			"days_walked"	: 1,
			"days_camped"	: 0,
			"days_other"	: 0,
			"dist_walked"	: 8.0,
			"complete"	: 100,
			"latitude"	: 53.069174,
			"longitude"	: -4.050007,
			"zoom"		: 14
		},
		"south.west.coast" : {
			"fullname"	: "South West Coast Path &mdash; National Trail",
			"name"		: "South West Coast",
			"attr"		: "cefhrs",
			"dist_route"	: 630.0,
			"date_start"	: "2012-04-30",
			"date_end"	: "2012-06-23",
			"days_walked"	: 36,
			"days_camped"	: 32,
			"days_other"	: 3,
			"dist_walked"	: 648.0,
			"complete"	: 100,
			"custom"	: "ferry_icon",
			"latitude"	: 50.457504,
			"longitude"	: -4.037476,
			"zoom"		: 8
		},
		"thanet.coast" : {
			"fullname"	: "Thanet Coastal Path",
			"name"		: "Thanet Coast",
			"attr"		: "cehrs",
			"dist_route"	: 19.6,
			"date_start"	: "2013-01-14",
			"date_end"	: "2013-01-15",
			"days_walked"	: 2,
			"days_camped"	: 1,
			"days_other"	: 0,
			"dist_walked"	: 21.2,
			"complete"	: 100,
			"latitude"	: 51.352058,
			"longitude"	: 1.332092,
			"zoom"		: 12
		},
		"three.towers" : {
			"fullname"	: "Three Towers",
			"name"		: "Three Towers",
			"attr"		: "ehrs",
			"dist_route"	: 45.0,
			"date_start"	: "2010-04-10",
			"date_end"	: "2010-04-10",
			"days_walked"	: 1,
			"days_camped"	: 0,
			"days_other"	: 0,
			"dist_walked"	: 45.0,
			"complete"	: 100,
			"latitude"	: 51.510025,
			"longitude"	: -1.198196,
			"zoom"		: 11
		},
		"white.cliffs" : {
			"fullname"	: "White Cliffs Country Trails",
			"name"		: "White Cliffs",
			"attr"		: "ehrs",
			"dist_route"	: 9.2,
			"date_start"	: "2013-01-14",
			"date_end"	: "2013-01-14",
			"days_walked"	: 1,
			"days_camped"	: 0,
			"days_other"	: 0,
			"dist_walked"	: 10.0,
			"complete"	: 100,
			"latitude"	: 51.174823,
			"longitude"	: 1.358528,
			"zoom"		: 12
		},
		"yorkshire.three.peaks" : {
			"fullname"	: "Yorkshire Three Peaks",
			"name"		: "Yorkshire Three Peaks",
			"attr"		: "ehrs",
			"dist_route"	: 24.5,
			"date_start"	: "2011-08-03",
			"date_end"	: "2011-08-03",
			"days_walked"	: 1,
			"days_camped"	: 0,
			"days_other"	: 0,
			"dist_walked"	: 24.5,
			"complete"	: 100,
			"latitude"	: 54.188959,
			"longitude"	: -2.333221,
			"zoom"		: 12
		},

		// Incomplete routes
		"1066.country.walk" : {
			"fullname"	: "1066 Country Walk",
			"name"		: "1066 Country Walk",
			"attr"		: "cehrst",
			"dist_route"	: 31.6,
			"date_start"	: "2013-01-09",
			"days_walked"	: 3,
			"days_camped"	: 2,
			"days_other"	: 0,
			"dist_walked"	: 30.7,
			"complete"	: 97,
			"latitude"	: 50.884842,
			"longitude"	: 0.521851,
			"zoom"		: 11
		},
		"arden.way" : {
			"fullname"	: "Arden Way",
			"name"		: "Arden Way",
			"attr"		: "cehrst",
			"dist_route"	: 26.5,
			"date_start"	: "2012-12-18",
			"days_walked"	: 2,
			"days_camped"	: 1,
			"days_other"	: 0,
			"dist_walked"	: 7.8,
			"complete"	: 29,
			"latitude"	: 52.264375,
			"longitude"	: -1.849136,
			"zoom"		: 12
		},
		"cleveland.way" : {
			"fullname"	: "Cleveland Way &mdash; National Trail",
			"name"		: "Cleveland Way",
			"attr"		: "cehrst",
			"dist_route"	: 106.4,
			"date_start"	: "2012-10-08",
			"days_walked"	: 2,
			"days_camped"	: 1,
			"days_other"	: 0,
			"dist_walked"	: 13.8,
			"complete"	: 13,
			"latitude"	: 54.404544,
			"longitude"	: -0.802002,
			"zoom"		: 10
		},
		"cotswold.canals" : {
			"fullname"	: "Cotswold Canals Walk",
			"name"		: "Cotswold Canals",
			"attr"		: "ehrst",
			"dist_route"	: 41.3,
			"date_start"	: "2013-02-28",
			"days_walked"	: 1,
			"days_camped"	: 0,
			"days_other"	: 0,
			"dist_walked"	: 19.8,
			"complete"	: 48,
			"latitude"	: 51.723626,
			"longitude"	: -2.028351,
			"zoom"		: 10
		},
		"coventry.way" : {
			"fullname"	: "Coventry Way",
			"name"		: "Coventry Way",
			"attr"		: "ehrst",
			"dist_route"	: 40.1,
			"date_start"	: "2012-12-18",
			"days_walked"	: 1,
			"days_camped"	: 0,
			"days_other"	: 0,
			"dist_walked"	: 3.8,
			"complete"	: 9,
			"latitude"	: 52.409959,
			"longitude"	: -1.492081,
			"zoom"		: 11
		},
		"dales.centurion" : {
			"fullname"	: "Yorkshire Dales Centurion Walk",
			"name"		: "Dales Centurion Walk",
			"attr"		: "cehrst",
			"dist_route"	: 100.1,
			"date_start"	: "2011-08-03",
			"days_walked"	: 3,
			"days_camped"	: 0,
			"days_other"	: 1,
			"dist_walked"	: 25.6,
			"complete"	: 26,
			"latitude"	: 54.308512,
			"longitude"	: -2.234344,
			"zoom"		: 10
		},
		"dales.top.ten" : {
			"fullname"	: "Yorkshire Dales Top Ten",
			"name"		: "Dales Top Ten",
			"attr"		: "cehrst",
			"dist_route"	: 77.1,
			"date_start"	: "2010-09-25",
			"days_walked"	: 3,
			"days_camped"	: 1,
			"days_other"	: 0,
			"dist_walked"	: 25.2,
			"complete"	: 33,
			"latitude"	: 54.265224,
			"longitude"	: -2.241211,
			"zoom"		: 10
		},
		"dales.walk" : {
			"fullname"	: "Dales Walk",
			"name"		: "Dales Walk",
			"attr"		: "cehrst",
			"dist_route"	: 71.7,
			"date_start"	: "2012-10-04",
			"days_walked"	: 3,
			"days_camped"	: 1,
			"days_other"	: 0,
			"dist_walked"	: 15.9,
			"complete"	: 22,
			"latitude"	: 54.372559,
			"longitude"	: -2.050323,
			"zoom"		: 10
		},
		"gritstone.trail" : {
			"fullname"	: "Gritstone Trail",
			"name"		: "Gritstone Trail",
			"attr"		: "cehrst",
			"dist_route"	: 34.7,
			"date_start"	: "2012-12-12",
			"days_walked"	: 2,
			"days_camped"	: 1,
			"days_other"	: 0,
			"dist_walked"	: 21.4,
			"complete"	: 62,
			"latitude"	: 53.217546,
			"longitude"	: -2.140961,
			"zoom"		: 10
		},
		"hadrians.wall" : {
			"fullname"	: "Hadrians Wall Path &mdash; National Trail",
			"name"		: "Hadrians Wall",
			"attr"		: "ehrst",
			"dist_route"	: 86.1,
			"date_start"	: "2012-10-14",
			"days_walked"	: 1,
			"days_camped"	: 0,
			"days_other"	: 0,
			"dist_walked"	: 9.5,
			"complete"	: 11,
			"latitude"	: 54.963425,
			"longitude"	: -2.364807,
			"zoom"		: 9
		},
		"heart.of.england" : {
			"fullname"	: "Heart of England Way",
			"name"		: "Heart of England",
			"attr"		: "cehrst",
			"dist_route"	: 101.0,
			"date_start"	: "2012-12-16",
			"date_end"	: "2012-12-21",
			"days_walked"	: 6,
			"days_camped"	: 5,
			"days_other"	: 0,
			"dist_walked"	: 102.7,
			"complete"	: 95,
			"latitude"	: 52.357151,
			"longitude"	: -1.845703,
			"zoom"		: 9
		},
		"lyke.wake.walk" : {
			"fullname"	: "Lyke Wake Walk",
			"name"		: "Lyke Wake Walk",
			"attr"		: "cehrst",
			"dist_route"	: 39.2,
			"date_start"	: "2012-10-08",
			"days_walked"	: 2,
			"days_camped"	: 1,
			"days_other"	: 0,
			"dist_walked"	: 22.5,
			"complete"	: 57,
			"latitude"	: 54.398149,
			"longitude"	: -0.892639,
			"zoom"		: 10
		},
		"oldham.way" : {
			"fullname"	: "Oldham Way",
			"name"		: "Oldham Way",
			"attr"		: "cehrst",
			"dist_route"	: 38.5,
			"date_start"	: "2010-09-22",
			"days_walked"	: 3,
			"days_camped"	: 1,
			"days_other"	: 0,
			"dist_walked"	: 11.8,
			"complete"	: 31,
			"latitude"	: 53.544184,
			"longitude"	: -2.065086,
			"zoom"		: 12
		},
		"oxford.canal" : {
			"fullname"	: "Oxford Canal Walk",
			"name"		: "Oxford Canal",
			"attr"		: "cehrst",
			"dist_route"	: 81.8,
			"date_start"	: "2013-02-23",
			"days_walked"	: 2,
			"days_camped"	: 1,
			"days_other"	: 0,
			"dist_walked"	: 11.1,
			"complete"	: 14,
			"latitude"	: 52.104818,
			"longitude"	: -0.997009,
			"zoom"		: 9
		},
		"oxfordshire.way" : {
			"fullname"	: "Oxfordshire Way",
			"name"		: "Oxfordshire Way",
			"attr"		: "cehrst",
			"dist_route"	: 67.1,
			"date_start"	: "2012-12-21",
			"days_walked"	: 2,
			"days_camped"	: 1,
			"days_other"	: 0,
			"dist_walked"	: 29.8,
			"complete"	: 44,
			"latitude"	: 51.720223,
			"longitude"	: -1.332092,
			"zoom"		: 10
		},
		"pilgrims.way" : {
			"fullname"	: "Pilgrims Way",
			"name"		: "Pilgrims Way",
			"attr"		: "cehrst",
			"dist_route"	: 132.4,
			"date_start"	: "2013-02-04",
			"days_walked"	: 5,
			"days_camped"	: 4,
			"days_other"	: 0,
			"dist_walked"	: 105.9,
			"complete"	: 80,
			"latitude"	: 51.025849,
			"longitude"	: -0.131836,
			"zoom"		: 9
		},
		"saxon.shore" : {
			"fullname"	: "Saxon Shore Way",
			"name"		: "Saxon Shore",
			"attr"		: "cehrst",
			"dist_route"	: 163.2,
			"date_start"	: "2013-01-12",
			"days_walked"	: 9,
			"days_camped"	: 5,
			"days_other"	: 1,
			"dist_walked"	: 103.5,
			"complete"	: 63,
			"latitude"	: 51.169011,
			"longitude"	: 0.818481,
			"zoom"		: 9
		},
		"solent.way" : {
			"fullname"	: "Solent Way",
			"name"		: "Solent Way",
			"attr"		: "cehrst",
			"dist_route"	: 62.6,
			"date_start"	: "2012-12-30",
			"days_walked"	: 5,
			"days_camped"	: 3,
			"days_other"	: 1,
			"dist_walked"	: 58.5,
			"complete"	: 93,
			"latitude"	: 50.739932,
			"longitude"	: -1.196136,
			"zoom"		: 10
		},
		"south.downs" : {
			"fullname"	: "South Downs Way &mdash; National Trail",
			"name"		: "South Downs",
			"attr"		: "cehrst",
			"dist_route"	: 94.7,
			"date_start"	: "2013-01-06",
			"days_walked"	: 4,
			"days_camped"	: 3,
			"days_other"	: 0,
			"dist_walked"	: 74.1,
			"complete"	: 78,
			"latitude"	: 50.786838,
			"longitude"	: -0.359802,
			"zoom"		: 9
		},
		"staffordshire.moorlands" : {
			"fullname"	: "Staffordshire Moorlands Challenge Walk",
			"name"		: "Staffordshire Moorlands",
			"attr"		: "ehrst",
			"dist_route"	: 21.8,
			"date_start"	: "2012-12-14",
			"days_walked"	: 1,
			"days_camped"	: 0,
			"days_other"	: 0,
			"dist_walked"	: 5.1,
			"complete"	: 24,
			"latitude"	: 53.000736,
			"longitude"	: -1.883125,
			"zoom"		: 12
		},
		"staffordshire.way" : {
			"fullname"	: "Staffordshire Way",
			"name"		: "Staffordshire Way",
			"attr"		: "cehrst",
			"dist_route"	: 94.5,
			"date_start"	: "2012-12-13",
			"days_walked"	: 3,
			"days_camped"	: 2,
			"days_other"	: 0,
			"dist_walked"	: 47.5,
			"complete"	: 50,
			"latitude"	: 52.792797,
			"longitude"	: -2.046204,
			"zoom"		: 9
		},
		"tameside.trail" : {
			"fullname"	: "Tameside Trail",
			"name"		: "Tameside Trail",
			"attr"		: "ehrst",
			"dist_route"	: 34.2,
			"date_start"	: "2012-12-11",
			"days_walked"	: 1,
			"days_camped"	: 0,
			"days_other"	: 0,
			"dist_walked"	: 10.2,
			"complete"	: 30,
			"latitude"	: 53.478852,
			"longitude"	: -2.075386,
			"zoom"		: 12
		},
		"thames.path" : {
			"fullname"	: "Thames Path &mdash; National Trail",
			"name"		: "Thames Path",
			"attr"		: "cehrstv",
			"dist_route"	: 181.8,
			"date_start"	: "2013-02-19",
			"days_walked"	: 8,
			"days_camped"	: 6,
			"days_other"	: 0,
			"dist_walked"	: 166.0,
			"complete"	: 80,
			"latitude"	: 51.536086,
			"longitude"	: -0.999756,
			"zoom"		: 9
		},
		"wey.navigation" : {
			"fullname"	: "Wey Navigation",
			"name"		: "Wey Navigation",
			"attr"		: "ehrst",
			"dist_route"	: 19.3,
			"date_start"	: "2013-02-08",
			"days_walked"	: 2,
			"days_camped"	: 0,
			"days_other"	: 0,
			"dist_walked"	: 16.6,
			"complete"	: 86,
			"latitude"	: 51.282535,
			"longitude"	: -0.534897,
			"zoom"		: 11
		},
		"wysis.way" : {
			"fullname"	: "Wysis Way",
			"name"		: "Wysis Way",
			"attr"		: "ehrst",
			"dist_route"	: 51.8,
			"date_start"	: "2013-02-28",
			"days_walked"	: 1,
			"days_camped"	: 0,
			"days_other"	: 0,
			"dist_walked"	: 7.4,
			"complete"	: 14,
			"latitude"	: 51.778887,
			"longitude"	: -2.39502,
			"zoom"		: 10
		},

		// Unstarted routes
		"ayrshire.coast" : {
			"fullname"	: "Ayrshire Coastal Path",
			"name"		: "Ayrshire Coastal Path",
			"attr"		: "ers",
			"dist_route"	: 78.3,
			"latitude"	: 55.463285,
			"longitude"	: -4.812012,
			"zoom"		: 8
		},
		"berwick.boundary" : {
			"fullname"	: "Berwick Borough Boundary Walk",
			"name"		: "Berwick Borough Boundary Walk",
			"attr"		: "ers",
			"dist_route"	: 109.3,
			"latitude"	: 55.583002,
			"longitude"	: -2.024231,
			"zoom"		: 10
		},
		"calderdale.way" : {
			"fullname"	: "Calderdale Way",
			"name"		: "Calderdale Way",
			"attr"		: "ers",
			"dist_route"	: 49.6,
			"latitude"	: 53.723936,
			"longitude"	: -1.925354,
			"zoom"		: 11
		},
		"central.scottish.way" : {
			"fullname"	: "Central Scottish Way",
			"name"		: "Central Scottish Way",
			"attr"		: "ers",
			"dist_route"	: 146.6,
			"latitude"	: 55.856817,
			"longitude"	: -3.142090,
			"zoom"		: 8
		},
		"coast.to.coast.alternative" : {
			"fullname"	: "Alternative Coast to Coast",
			"name"		: "Alternative Coast to Coast",
			"attr"		: "ers",
			"dist_route"	: 200.1,
			"latitude"	: 54.829172,
			"longitude"	: -2.433472,
			"zoom"		: 8
		},
		"coast.to.coast.scotland" : {
			"fullname"	: "Coast to Coast Scotland",
			"name"		: "Coast to Coast Scotland",
			"attr"		: "ers",
			"dist_route"	: 134.4,
			"latitude"	: 56.398705,
			"longitude"	: -4.213257,
			"zoom"		: 8
		},
		"coast.to.coast.south" : {
			"fullname"	: "Southern Coast to Coast",
			"name"		: "Southern Coast to Coast",
			"attr"		: "ers",
			"dist_route"	: 277.8,
			"latitude"	: 51.141448,
			"longitude"	: -1.142578,
			"zoom"		: 8
		},
		"cotswold.diamond" : {
			"fullname"	: "Diamond Way North Cotswold",
			"name"		: "Diamond Way North Cotswold",
			"attr"		: "ers",
			"dist_route"	: 65.4,
			"latitude"	: 51.940879,
			"longitude"	: -1.754379,
			"zoom"		: 11
		},
		"cotswold.way" : {
			"fullname"	: "Cotswold Way - National Trail",
			"name"		: "Cotswold Way - National Trail",
			"attr"		: "ers",
			"dist_route"	: 101.1,
			"latitude"	: 51.795027,
			"longitude"	: -2.153320,
			"zoom"		: 9
		},
		"cross.cotswold" : {
			"fullname"	: "Cross Cotswold Pathway",
			"name"		: "Cross Cotswold Pathway",
			"attr"		: "ers",
			"dist_route"	: 90.3,
			"latitude"	: 51.801822,
			"longitude"	: -1.881409,
			"zoom"		: 9
		},
		"cumbria.coast" : {
			"fullname"	: "Cumbria Coastal Way",
			"name"		: "Cumbria Coastal Way",
			"attr"		: "ers",
			"dist_route"	: 192.4,
			"latitude"	: 54.535426,
			"longitude"	: -3.098145,
			"zoom"		: 9
		},
		"cumbrian.trident" : {
			"fullname"	: "Cumbrian Classic Trident Walk",
			"name"		: "Cumbrian Classic Trident Walk",
			"attr"		: "ers",
			"dist_route"	: 97.0,
			"latitude"	: 54.509124,
			"longitude"	: -3.081665,
			"zoom"		: 10
		},
		"cumbria.way" : {
			"fullname"	: "Cumbria Way",
			"name"		: "Cumbria Way",
			"attr"		: "ers",
			"dist_route"	: 73.6,
			"latitude"	: 54.557730,
			"longitude"	: -3.081665,
			"zoom"		: 9
		},
		"dales.challenge" : {
			"fullname"	: "Yorkshire Dales Challenge Walk",
			"name"		: "Yorkshire Dales Challenge Walk",
			"attr"		: "ers",
			"dist_route"	: 22.0,
			"latitude"	: 54.178713,
			"longitude"	: -2.117271,
			"zoom"		: 12
		},
		"dales.way" : {
			"fullname"	: "Dales Way",
			"name"		: "Dales Way",
			"attr"		: "ers",
			"dist_route"	: 78.1,
			"latitude"	: 54.191370,
			"longitude"	: -2.296143,
			"zoom"		: 9
		},
		"dane.valley" : {
			"fullname"	: "Dane Valley Way",
			"name"		: "Dane Valley Way",
			"attr"		: "ers",
			"dist_route"	: 40.5,
			"latitude"	: 53.206033,
			"longitude"	: -2.142334,
			"zoom"		: 10
		},
		"e8" : {
			"fullname"	: "E8 Hull to Liverpool",
			"name"		: "E8 Hull to Liverpool",
			"attr"		: "ers",
			"dist_route"	: 178.8,
			"latitude"	: 53.497850,
			"longitude"	: -1.642456,
			"zoom"		: 8
		},
		"elham.valley" : {
			"fullname"	: "Elham Valley Way",
			"name"		: "Elham Valley Way",
			"attr"		: "ers",
			"dist_route"	: 21.7,
			"latitude"	: 51.184938,
			"longitude"	: 1.119232 ,
			"zoom"		: 11
		},
		"eskdale.way" : {
			"fullname"	: "Eskdale Way",
			"name"		: "Eskdale Way",
			"attr"		: "ers",
			"dist_route"	: 88.2,
			"latitude"	: 54.434908,
			"longitude"	: -0.843201,
			"zoom"		: 11
		},
		"esk.valley" : {
			"fullname"	: "Esk Valley Walk",
			"name"		: "Esk Valley Walk",
			"attr"		: "ers",
			"dist_route"	: 36.9,
			"latitude"	: 54.428518,
			"longitude"	: -0.790329,
			"zoom"		: 11
		},
		"etherow.goyt.valley" : {
			"fullname"	: "Etherow - Goyt Valley Way",
			"name"		: "Etherow - Goyt Valley Way",
			"attr"		: "ers",
			"dist_route"	: 14.1,
			"latitude"	: 53.428560,
			"longitude"	: -2.040367,
			"zoom"		: 12
		},
		"fife.coast" : {
			"fullname"	: "Fife Coastal Path",
			"name"		: "Fife Coastal Path",
			"attr"		: "ers",
			"dist_route"	: 115.1,
			"latitude"	: 56.238008,
			"longitude"	: -3.228607,
			"zoom"		: 10
		},
		"five.degrees.west" : {
			"fullname"	: "Five Degrees West",
			"name"		: "Five Degrees West",
			"attr"		: "ers",
			"dist_route"	: 290,
			"latitude"	: 57.106419,
			"longitude"	: -4.943848,
			"zoom"		: 7,
			"custom"	: "line",
		},
		"gloucestershire.way" : {
			"fullname"	: "Gloucestershire Way",
			"name"		: "Gloucestershire Way",
			"attr"		: "ers",
			"dist_route"	: 94.2,
			"latitude"	: 51.808615,
			"longitude"	: -2.230225,
			"zoom"		: 10
		},
		"glyndwrs.way" : {
			"fullname"	: "Glyndwrs Way - National Trail",
			"name"		: "Glyndwrs Way - National Trail",
			"attr"		: "ers",
			"dist_route"	: 136.6,
			"latitude"	: 52.538779,
			"longitude"	: -3.361816,
			"zoom"		: 10
		},
		"goyt.way" : {
			"fullname"	: "Goyt Way",
			"name"		: "Goyt Way",
			"attr"		: "ers",
			"dist_route"	: 9.7,
			"latitude"	: 53.371654,
			"longitude"	: -2.028351,
			"zoom"		: 12
		},
		"great.english.walk" : {
			"fullname"	: "Great English Walk",
			"name"		: "Great English Walk",
			"attr"		: "ers",
			"dist_route"	: 586.0,
			"latitude"	: 53.638125,
			"longitude"	: -2.065430,
			"zoom"		: 7
		},
		"great.glen.way" : {
			"fullname"	: "Great Glen Way - National Trail",
			"name"		: "Great Glen Way - National Trail",
			"attr"		: "ers",
			"dist_route"	: 72.6,
			"latitude"	: 57.166036,
			"longitude"	: -4.600525,
			"zoom"		: 9
		},
		"hadrians.coast" : {
			"fullname"	: "Hadrians Coastal Route",
			"name"		: "Hadrians Coastal Route",
			"attr"		: "ers",
			"dist_route"	: 77.7,
			"latitude"	: 54.678595,
			"longitude"	: -3.370056,
			"zoom"		: 9
		},
		"heart.of.snowdonia" : {
			"fullname"	: "Heart of Snowdonia",
			"name"		: "Heart of Snowdonia",
			"attr"		: "ers",
			"dist_route"	: 48.9,
			"latitude"	: 53.081240,
			"longitude"	: -4.011383,
			"zoom"		: 11
		},
		"hobblers.way" : {
			"fullname"	: "Hobblers Way",
			"name"		: "Hobblers Way",
			"attr"		: "ers",
			"dist_route"	: 192.3,
			"latitude"	: 52.221070,
			"longitude"	: -1.071167,
			"zoom"		: 8
		},
		"isaacs.tea.trail" : {
			"fullname"	: "Isaacs Tea Trail",
			"name"		: "Isaacs Tea Trail",
			"attr"		: "ers",
			"dist_route"	: 37.3,
			"latitude"	: 54.849932,
			"longitude"	: -2.347641,
			"zoom"		: 12
		},
		"itchen.way" : {
			"fullname"	: "Itchen Way",
			"name"		: "Itchen Way",
			"attr"		: "ers",
			"dist_route"	: 30.4,
			"latitude"	: 50.984370,
			"longitude"	: -1.290207,
			"zoom"		: 11
		},
		"lancashire.coast" : {
			"fullname"	: "Lancashire Coastal Way",
			"name"		: "Lancashire Coastal Way",
			"attr"		: "ers",
			"dist_route"	: 68.1,
			"latitude"	: 53.956086,
			"longitude"	: -2.860565,
			"zoom"		: 10
		},
		"macmillan.abbotsbury.langport" : {
			"fullname"	: "Macmillan Abbotsbury Langport Link",
			"name"		: "Macmillan Abbotsbury Langport Link",
			"attr"		: "ers",
			"dist_route"	: 40.4,
			"latitude"	: 50.875311,
			"longitude"	: -2.712250,
			"zoom"		: 10
		},
		"macmillan.way" : {
			"fullname"	: "Macmillan Way",
			"name"		: "Macmillan Way",
			"attr"		: "ers",
			"dist_route"	: 286.5,
			"latitude"	: 52.099757,
			"longitude"	: -1.065674,
			"zoom"		: 7
		},
		"macmillan.way.west" : {
			"fullname"	: "Macmillan Way West",
			"name"		: "Macmillan Way West",
			"attr"		: "ers",
			"dist_route"	: 101.5,
			"latitude"	: 51.110420,
			"longitude"	: -3.342590,
			"zoom"		: 9
		},
		"midshires.way" : {
			"fullname"	: "Midshires Way",
			"name"		: "Midshires Way",
			"attr"		: "ers",
			"dist_route"	: 223.7,
			"latitude"	: 52.636397,
			"longitude"	: -1.334839,
			"zoom"		: 8
		},
		"millennium.way" : {
			"fullname"	: "Way For The Millennium",
			"name"		: "Way For The Millennium",
			"attr"		: "ers",
			"dist_route"	: 37.7,
			"latitude"	: 52.762892,
			"longitude"	: -1.972046,
			"zoom"		: 10
		},
		"monarchs.way" : {
			"fullname"	: "Monarchs Way",
			"name"		: "Monarchs Way",
			"attr"		: "ers",
			"dist_route"	: 564.7,
			"latitude"	: 51.655519,
			"longitude"	: -2.147827,
			"zoom"		: 8
		},
		"mull.of.galloway.trail" : {
			"fullname"	: "Mull Of Galloway Trail",
			"name"		: "Mull Of Galloway Trail",
			"attr"		: "ers",
			"dist_route"	: 35.5,
			"latitude"	: 54.846571,
			"longitude"	: -4.980927,
			"zoom"		: 10
		},
		"nelson.way" : {
			"fullname"	: "Nelson Way",
			"name"		: "Nelson Way",
			"attr"		: "ers",
			"dist_route"	: 406.3,
			"latitude"	: 51.730431,
			"longitude"	: 0.318604 ,
			"zoom"		: 8
		},
		"north.to.the.cape" : {
			"fullname"	: "North to the Cape",
			"name"		: "North to the Cape",
			"attr"		: "ers",
			"dist_route"	: 218.3,
			"latitude"	: 57.671848,
			"longitude"	: -5.026245,
			"zoom"		: 8
		},
		"northumberland.coast" : {
			"fullname"	: "Northumberland Coast Path",
			"name"		: "Northumberland Coast Path",
			"attr"		: "ers",
			"dist_route"	: 63.9,
			"latitude"	: 55.522412,
			"longitude"	: -1.782532,
			"zoom"		: 9
		},
		"offas.dyke" : {
			"fullname"	: "Offas Dyke Path - National Trail",
			"name"		: "Offas Dyke Path - National Trail",
			"attr"		: "ers",
			"dist_route"	: 178.1,
			"latitude"	: 52.479435,
			"longitude"	: -3.246460,
			"zoom"		: 8
		},
		"peddars.way.and.norfolk.coast" : {
			"fullname"	: "Peddars Way and Norfolk Coast Path - National Trail",
			"name"		: "Peddars Way and Norfolk Coast Path - National Trail",
			"attr"		: "ers",
			"dist_route"	: 96.7,
			"latitude"	: 52.757905,
			"longitude"	: 0.892639 ,
			"zoom"		: 9
		},
		"pembrokshire.coast" : {
			"fullname"	: "Pembrokshire Coast Path - National Trail",
			"name"		: "Pembrokshire Coast Path - National Trail",
			"attr"		: "ers",
			"dist_route"	: 182.1,
			"latitude"	: 51.849353,
			"longitude"	: -4.879303,
			"zoom"		: 10
		},
		"pennine.bridleway" : {
			"fullname"	: "Pennine Bridleway - National Trail",
			"name"		: "Pennine Bridleway - National Trail",
			"attr"		: "ers",
			"dist_route"	: 163.4,
			"latitude"	: 53.690201,
			"longitude"	: -2.164307,
			"zoom"		: 8
		},
		"ribble.way" : {
			"fullname"	: "Ribble Way",
			"name"		: "Ribble Way",
			"attr"		: "ers",
			"dist_route"	: 68.9,
			"latitude"	: 53.964165,
			"longitude"	: -2.419739,
			"zoom"		: 9
		},
		"ridgeway" : {
			"fullname"	: "Ridgeway - National Trail",
			"name"		: "Ridgeway - National Trail",
			"attr"		: "ers",
			"dist_route"	: 85.7,
			"latitude"	: 51.614606,
			"longitude"	: -1.186523,
			"zoom"		: 10
		},
		"river.parrett" : {
			"fullname"	: "River Parrett Trail",
			"name"		: "River Parrett Trail",
			"attr"		: "ers",
			"dist_route"	: 44.2,
			"latitude"	: 51.024121,
			"longitude"	: -2.855072,
			"zoom"		: 10
		},
		"rob.roy.way" : {
			"fullname"	: "Rob Roy Way",
			"name"		: "Rob Roy Way",
			"attr"		: "ers",
			"dist_route"	: 79.4,
			"latitude"	: 56.409343,
			"longitude"	: -4.095154,
			"zoom"		: 9
		},
		"rochdale.way" : {
			"fullname"	: "Rochdale Way",
			"name"		: "Rochdale Way",
			"attr"		: "ers",
			"dist_route"	: 48.1,
			"latitude"	: 53.613081,
			"longitude"	: -2.146454,
			"zoom"		: 12
		},
		"sefton.coast" : {
			"fullname"	: "Sefton Coastal Path",
			"name"		: "Sefton Coastal Path",
			"attr"		: "ers",
			"dist_route"	: 21.9,
			"latitude"	: 53.581500,
			"longitude"	: -3.019867,
			"zoom"		: 11
		},
		"severn.way" : {
			"fullname"	: "Severn Way",
			"name"		: "Severn Way",
			"attr"		: "ers",
			"dist_route"	: 223.8,
			"latitude"	: 52.146973,
			"longitude"	: -2.982788,
			"zoom"		: 8
		},
		"shakespeare.way" : {
			"fullname"	: "Shakespeare Way",
			"name"		: "Shakespeare Way",
			"attr"		: "ers",
			"dist_route"	: 128.9,
			"latitude"	: 51.779736,
			"longitude"	: -1.197510,
			"zoom"		: 9
		},
		"snowdonia.to.the.gower" : {
			"fullname"	: "Snowdonia to the Gower",
			"name"		: "Snowdonia to the Gower",
			"attr"		: "ers",
			"dist_route"	: 208.7,
			"latitude"	: 52.425873,
			"longitude"	: -3.850708,
			"zoom"		: 8
		},
		"southern.upland.way" : {
			"fullname"	: "Southern Upland Way - National Trail",
			"name"		: "Southern Upland Way - National Trail",
			"attr"		: "ers",
			"dist_route"	: 211.2,
			"latitude"	: 55.394712,
			"longitude"	: -3.543091,
			"zoom"		: 8
		},
		"south.tyne.trail" : {
			"fullname"	: "South Tyne Trail",
			"name"		: "South Tyne Trail",
			"attr"		: "ers",
			"dist_route"	: 22.0,
			"latitude"	: 54.844199,
			"longitude"	: -2.462311,
			"zoom"		: 11
		},
		"speyside.way" : {
			"fullname"	: "Speyside Way - National Trail",
			"name"		: "Speyside Way - National Trail",
			"attr"		: "ers",
			"dist_route"	: 66.1,
			"latitude"	: 57.405023,
			"longitude"	: -3.337097,
			"zoom"		: 10
		},
		"staffordshire.gritstone" : {
			"fullname"	: "Staffordshire Gritstone Walk",
			"name"		: "Staffordshire Gritstone Walk",
			"attr"		: "ers",
			"dist_route"	: 34.7,
			"latitude"	: 53.158300,
			"longitude"	: -1.947670,
			"zoom"		: 12
		},
		"standedge.trail" : {
			"fullname"	: "Standedge Trail",
			"name"		: "Standedge Trail",
			"attr"		: "ers",
			"dist_route"	: 11.3,
			"latitude"	: 53.585882,
			"longitude"	: -1.959686,
			"zoom"		: 13
		},
		"staunton.way" : {
			"fullname"	: "Staunton Way",
			"name"		: "Staunton Way",
			"attr"		: "ers",
			"dist_route"	: 21.1,
			"latitude"	: 50.927925,
			"longitude"	: -0.952377,
			"zoom"		: 12
		},
		"st.cuthberts" : {
			"fullname"	: "St Cuthberts Way",
			"name"		: "St Cuthberts Way",
			"attr"		: "ers",
			"dist_route"	: 64.3,
			"latitude"	: 55.550388,
			"longitude"	: -2.254944,
			"zoom"		: 10
		},
		"suffolk.coast.and.heath" : {
			"fullname"	: "Suffolk Coast and Heath Path",
			"name"		: "Suffolk Coast and Heath Path",
			"attr"		: "ers",
			"dist_route"	: 57.6,
			"latitude"	: 52.209290,
			"longitude"	: 1.610870 ,
			"zoom"		: 10
		},
		"tandridge.border" : {
			"fullname"	: "Tandridge Border Path",
			"name"		: "Tandridge Border Path",
			"attr"		: "ers",
			"dist_route"	: 52.1,
			"latitude"	: 51.231828,
			"longitude"	: -0.045319,
			"zoom"		: 11
		},
		"tennyson.trail" : {
			"fullname"	: "Tennyson Trail",
			"name"		: "Tennyson Trail",
			"attr"		: "ers",
			"dist_route"	: 13.8,
			"latitude"	: 50.662955,
			"longitude"	: -1.428909,
			"zoom"		: 11
		},
		"thames.estuary" : {
			"fullname"	: "Thames Estuary Trail",
			"name"		: "Thames Estuary Trail",
			"attr"		: "ers",
			"dist_route"	: 115.0,
			"latitude"	: 51.480528,
			"longitude"	: 0.623474 ,
			"zoom"		: 10
		},
		"thames.path.south.east" : {
			"fullname"	: "Thames Path South East Extension",
			"name"		: "Thames Path South East Extension",
			"attr"		: "ers",
			"dist_route"	: 10.5,
			"latitude"	: 51.492500,
			"longitude"	: 0.120850 ,
			"zoom"		: 12
		},
		"three.ridings.on.foot" : {
			"fullname"	: "Three Ridings On Foot",
			"name"		: "Three Ridings On Foot",
			"attr"		: "ers",
			"dist_route"	: 443.7,
			"latitude"	: 53.985165,
			"longitude"	: -1.312866,
			"zoom"		: 8
		},
		"todmorden.centenary" : {
			"fullname"	: "Todmorden Centenary Way",
			"name"		: "Todmorden Centenary Way",
			"attr"		: "ers",
			"dist_route"	: 23.7,
			"latitude"	: 53.705853,
			"longitude"	: -2.097702,
			"zoom"		: 13
		},
		"trans-pennine" : {
			"fullname"	: "Trans-Pennine Trail",
			"name"		: "Trans-Pennine Trail",
			"attr"		: "ers",
			"dist_route"	: 209.0,
			"latitude"	: 53.589244,
			"longitude"	: -1.609497,
			"zoom"		: 8
		},
		"tyne.estuary" : {
			"fullname"	: "Tyne Estuary to Source",
			"name"		: "Tyne Estuary to Source",
			"attr"		: "ers",
			"dist_route"	: 87.2,
			"latitude"	: 54.901093,
			"longitude"	: -1.937714,
			"zoom"		: 10
		},
		"wales.coast" : {
			"fullname"	: "Wales Coast Path",
			"name"		: "Wales Coast Path",
			"attr"		: "ers",
			"dist_route"	: 865.1,
			"latitude"	: 52.442618,
			"longitude"	: -3.477173,
			"zoom"		: 8
		},
		"wantsum.walk" : {
			"fullname"	: "Wantsum Walk",
			"name"		: "Wantsum Walk",
			"attr"		: "ers",
			"dist_route"	: 19.1,
			"latitude"	: 51.356346,
			"longitude"	: 1.214676 ,
			"zoom"		: 12
		},
		"welsh.3000s" : {
			"fullname"	: "Welsh 3000s",
			"name"		: "Welsh 3000s",
			"attr"		: "ers",
			"dist_route"	: 24.2,
			"latitude"	: 53.133178,
			"longitude"	: -4.017906,
			"zoom"		: 12
		},
		"west.highland.way" : {
			"fullname"	: "West Highland Way - National Trail",
			"name"		: "West Highland Way - National Trail",
			"attr"		: "ers",
			"dist_route"	: 94.1,
			"latitude"	: 56.328721,
			"longitude"	: -4.743347,
			"zoom"		: 9
		},
		"west.somerset.coast" : {
			"fullname"	: "West Somerset Coast Path",
			"name"		: "West Somerset Coast Path",
			"attr"		: "ers",
			"dist_route"	: 25.1,
			"latitude"	: 51.172886,
			"longitude"	: -3.258820,
			"zoom"		: 11
		},
		"west.sussex.literary" : {
			"fullname"	: "West Sussex Literary Trail",
			"name"		: "West Sussex Literary Trail",
			"attr"		: "ers",
			"dist_route"	: 49.0,
			"latitude"	: 50.953669,
			"longitude"	: -0.526657,
			"zoom"		: 11
		},
		"wey.south" : {
			"fullname"	: "Wey South Path",
			"name"		: "Wey South Path",
			"attr"		: "ers",
			"dist_route"	: 34.4,
			"latitude"	: 51.072468,
			"longitude"	: -0.535583,
			"zoom"		: 10
		},
		"wirral.circular" : {
			"fullname"	: "Wirral Circular Trail",
			"name"		: "Wirral Circular Trail",
			"attr"		: "ers",
			"dist_route"	: 37.1,
			"latitude"	: 53.358338,
			"longitude"	: -3.059692,
			"zoom"		: 11
		},
		"wychwood.way" : {
			"fullname"	: "Wychwood Way",
			"name"		: "Wychwood Way",
			"attr"		: "ers",
			"dist_route"	: 39.7,
			"latitude"	: 52.140231,
			"longitude"	: -2.048950,
			"zoom"		: 11
		},
		"yorkshire.wolds" : {
			"fullname"	: "Yorkshire Wolds Way - National Trail",
			"name"		: "Yorkshire Wolds Way - National Trail",
			"attr"		: "ers",
			"dist_route"	: 78.8,
			"latitude"	: 53.963357,
			"longitude"	: -0.440826,
			"zoom"		: 10
		},

		// Hills
		"munros" : {
			"fullname"	: "Munros &mdash; Scotland",
			"name"		: "Munros",
			"attr"		: "ap",
			"complete"	: 0,
			"latitude"	: 56.670616,
			"longitude"	: -4.224243,
			"zoom"		: 7
		},
		"wainwrights" : {
			"fullname"	: "Wainwrights &mdash; Lake District",
			"name"		: "Wainwrights",
			"attr"		: "AawchPps",
			"date_start"	: "2012-10-22",
			"days_walked"	: 7,
			"days_camped"	: 6,
			"days_other"	: 1,
			"dist_walked"	: 104.0,
			"complete"	: 11,
			"latitude"	: 54.484200,
			"longitude"	: -3.079490,
			"zoom"		: 10
		}
	};
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
		if (marker_rich) {
			marker_rich.setMap (map);
		} else {
			var image = 'rich.png';
			marker_rich = new google.maps.Marker({
				position: new google.maps.LatLng(rich_info.latitude, rich_info.longitude),
				map: map,
				icon: image,
				title: "Where's Rich?"
			});

			google.maps.event.addListener(marker_rich, 'click', function() {
				  var message = '<div style="float: left; height: 100%;"><img src="flatcap.png"></div><h1>Rich</h1>' + rich_info.date + ': ' + rich_info.message;
				  geo.options.infoWindow.setContent (message);
				  geo.options.infoWindow.open (map, marker_rich);
			});
		}
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
		/*
		var message = '<div style="float: left; height: 100%;"><img src="flatcap.png"></div><h1>Rich</h1>' + rich_info.date + ': ' + rich_info.message;
		geo.options.infoWindow.setContent (message);
		geo.options.infoWindow.open (map, marker_rich);
		*/
	} else {
		if (marker_rich) {
			marker_rich.setMap (null);
		}
	}

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
	var keys     = [ 'hike', 'ferry', 'camp', 'todo', 'variant', 'route', 'start' ];
	var current_route = document.getElementById("dropdown").value;
	var check = document.getElementById(id);

	if (id == "opt_one") {
		opt_one = check.checked;
		if (!opt_one) {
			return;
		}
		// hide other routes
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
	var dd = document.getElementById("dropdown");
	var selection = dd.value;

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

	make_dropdown();
	dd.value = selection;

	if (opt_one) {
		hide_other_routes (dd.value);
	}

	if (dd.value == "") {
		dd.value = 0;
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


