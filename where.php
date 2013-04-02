<?php

$filename = "rich.json";

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

	$str = json_encode ($info);
	$str = "rich_info = $str";

	file_put_contents ($filename, $str);
}

function main()
{
	$info = get_json();
	$info->date = strftime ("%Y-%m-%d");

	$lat = get_url_variable ("lat");
	$lon = get_url_variable ("lon");
	$msg = get_url_variable ("msg");
	$dat = get_url_variable ("date");

	if (!empty ($lat)) { $info->latitude  = $lat; }
	if (!empty ($lon)) { $info->longitude = $lon; }
	if (!empty ($msg)) { $info->message   = $msg; }
	if (!empty ($dat)) { $info->date      = $dat; }

	echo "<pre>";

	echo "lat  = {$info->latitude}\n";
	echo "lon  = {$info->longitude}\n";
	echo "msg  = {$info->message}\n";
	echo "date = {$info->date}\n";

	put_json ($info);
}


date_default_timezone_set('Europe/London');

main();

