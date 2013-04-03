<?php

$filename = "rich.json";

function valid_coords ($lat, $lon)
{
	// bounds of UK
	if (($lat < 49) || ($lat > 59))
		return false;

	if (($lon < -8) || ($lon > 2))
		return false;

	return true;
}

function valid_route ($route)
{
	if ($route === false)
		return false;
	if (empty ($route))
		return true;

	$path = "web";
	$filename = "$path/$route/route.xml";

	return file_exists ($filename);
}

function valid_date ($date)
{
	$unix = strtotime ($date);
	if ($unix == 0)
		$unix = strtotime ("now");

	return strftime ("%Y-%m-%d", $unix);
}

function get_waypoint ($route, $wp, &$lat, &$lon)
{
	$map = array();
	$retval = 0;

	$path = "web";
	$route = "$path/$route/route.xml";
	$wp = "WP$wp";

	$map = exec ("grep -w $wp $route");

	$parts = explode ('"', $map);

	$conv_lat = $parts[1] / 23860929;
	$conv_lon = $parts[3] / 11930465;

	if (!valid_coords ($conv_lat, $conv_lon)) {
		return false;
	}

	$lat = $conv_lat;
	$lon = $conv_lon;

	return true;
}

function get_url_variable($name)
{
	$result = false;

	if (isset($_GET)) {
		if (array_key_exists($name, $_GET)) {
			$result = $_GET[$name];
		}
	}

	return $result;
}

function get_json()
{
	global $filename;

	$str = file_get_contents ($filename);

	$index = stripos ($str, '{');
	if ($index !== false) {
		$str = substr ($str, $index);
	}

	$index = stripos ($str, '}');
	if ($index !== false) {
		$str = substr ($str, 0, $index+1);
	}

	return json_decode ($str);
}

function put_json ($info)
{
	global $filename;

	$str = json_encode ($info, JSON_PRETTY_PRINT);
	$str = "rich_info = $str";

	file_put_contents ($filename, $str);
}

function main()
{
	$info = get_json();

	$lat = get_url_variable ("lat");
	$lon = get_url_variable ("lon");
	$msg = get_url_variable ("msg");
	$dat = get_url_variable ("date");
	$wpt = get_url_variable ("wp");
	$rte = get_url_variable ("route");

	if (valid_coords ($lat, $lon)) {
		$info->latitude  = $lat;
		$info->longitude = $lon;
	}

	if (valid_route ($rte)) {
		$info->route = $rte;
	}

	if ($wpt !== false) {
		if (!get_waypoint ($info->route, $wpt, $info->latitude, $info->longitude)) {
			$wpt = "invalid";
		}
	}

	$info->date = valid_date ($dat);

	if ($msg !== false) {
		$info->message = $msg;
	}

	printf ("<pre>\n");
	printf ("date  = %s (%s)\n", $info->date,strftime ("%A %-d %B %Y", strtotime ($info->date)));
	printf ("lat   = %0.6f\n",   $info->latitude);
	printf ("lon   = %0.6f\n",   $info->longitude);
	printf ("route = %s\n",      $info->route);
	printf ("wp    = %s\n",      $wpt);
	printf ("msg   = %s\n",      $info->message);

	put_json ($info);
}


date_default_timezone_set('Europe/London');

main();

