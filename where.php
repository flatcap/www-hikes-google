<?php

$filename = "rich.json";
$log_file = "data.log";

function valid_coords ($latitude, $longitude)
{
	// bounds of UK
	if (($latitude < 49) || ($latitude > 59))
		return false;

	if (($longitude < -8) || ($longitude > 2))
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

function get_waypoint ($route, $wp, &$latitude, &$longitude, &$percentage)
{
	$map = array();
	$retval = 0;
	$percentage = -1;

	$path = "web";
	$route = "$path/$route/route.xml";
	$wp = "WP$wp";

	$map = exec ("grep -nw $wp $route");
	$parts = explode ('"', $map);
	if (count ($parts) < 7)
		return false;

	$conv_lat = $parts[1] / 23860929;
	$conv_lon = $parts[3] / 11930465;

	if (!valid_coords ($conv_lat, $conv_lon)) {
		return false;
	}

	$latitude = $conv_lat;
	$longitude = $conv_lon;

	$map = exec ("wc -l $route");

	$num = intval ($parts[0]);
	$lines = intval ($map);

	// Round percentage to the nearest 5%
	$percentage = 5 * round ($num * 20 / $lines);

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
	global $log_file;

	$str = json_encode ($info, JSON_PRETTY_PRINT);
	$str = "rich_info = $str";

	file_put_contents ($filename, $str);
	file_put_contents ($log_file, $str, FILE_APPEND);
}

function main()
{
	$info = get_json();

	$date_bed   = get_url_variable ("bed");
	$date_seen  = get_url_variable ("date");
	$date_route = get_url_variable ("start");
	$latitude   = get_url_variable ("lat");
	$longitude  = get_url_variable ("lon");
	$message    = get_url_variable ("msg");
	$route      = get_url_variable ("route");
	$wp         = get_url_variable ("wp");

	if (valid_coords ($latitude, $longitude)) {
		$info->latitude  = $latitude;
		$info->longitude = $longitude;
	}

	if (valid_route ($route)) {
		$info->route = $route;
	}

	if ($wp !== false) {
		if (!get_waypoint ($info->route, $wp, $info->latitude, $info->longitude, $info->percentage)) {
			$wp = "invalid";
		}
	} else {
		$info->percentage = 0;
	}

	$info->date_seen = valid_date ($dat);

	if ($date_route !== false) {
		if (!empty ($date_route))
			$date_route = valid_date ($date_route);
		$info->date_route = $date_route;
	}

	if ($date_bed !== false) {
		if (!empty ($date_bed))
			$date_bed = valid_date ($date_bed);
		$info->date_bed = $date_bed;
	}

	if ($message !== false) {
		$info->message = $message;
	}

	printf ("<pre>\n");
	printf ("bed   = %s\n",      $info->date_bed);
	printf ("date  = %s (%s)\n", $info->date_seen, strftime ("%A %-d %B %Y", strtotime ($info->date_seen)));
	printf ("lat   = %0.6f\n",   $info->latitude);
	printf ("lon   = %0.6f\n",   $info->longitude);
	printf ("msg   = %s\n",      $info->message);
	printf ("route = %s\n",      $info->route);
	printf ("start = %s\n",      $info->date_route);
	printf ("wp    = %s\n",      $wp);
	printf ("%%age  = %d\n",     $info->percentage);

	put_json ($info);
}


date_default_timezone_set('Europe/London');

echo "<pre>";
main();

