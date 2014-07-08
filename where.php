<?php

$filename = "rich.json";
$log_file = "data.log";

function geo_lookup ($place, &$latitude, &$longitude)
{
	$place = urlencode ($place);

	$url = "https://maps.googleapis.com/maps/api/geocode/json?address=$place,uk";

	$json = file_get_contents ($url);
	if ($json === false) {
		return false;
	}

	$data = json_decode ($json);
	if ($data === NULL) {
		return false;
	}

	try {
		$lat  = $data->{'results'}[0]->{'geometry'}->{'location'}->{'lat'};
		$long = $data->{'results'}[0]->{'geometry'}->{'location'}->{'lng'};
	} catch (Exception $e) {
		return false;
	}

	$latitude  = $lat;
	$longitude = $long;

	return true;
}

function decode_dashed (&$coord)
{
	$pos = strpos ($coord, "'");
	if ($pos === false) {
		return;
	}

	$whole = substr ($coord, 0, $pos);
	$fract = substr ($coord, $pos+1);
	if ($whole < 0) {
		$fract *= -1;
	}

	$coord = $whole + ($fract / 60);
}

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

	$path = "routes";
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

	$path = "routes";
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

function create_form ($info)
{
	printf ("<html>\n");
	printf ("	<head>\n");
	printf ("		<title>Where's Rich</title>\n");
	printf ("		<style type='text/css'>\n");
	printf ("			label { display: block; float: left; width: 5em; clear: both; font-weight: bold; }\n");
	printf ("		</style>\n");
	printf ("	</head>\n");
	printf ("	<body>\n");
	printf ("		<a href='index.html'>Map</a>\n");
	printf ("		<form action='where.php'>\n");

	printf ("\t\t\t<label for='bed'>bed</label>     <input name='bed'   value='$info->date_bed'            /> <br />\n");
	printf ("\t\t\t<label for='date'>date</label>   <input name='date'  value='$info->date_seen'           /> <br />\n");
	printf ("\t\t\t<label for='lat'>lat</label>     <input name='lat'   value='%0.6f'                      /> <br />\n", $info->latitude);
	printf ("\t\t\t<label for='lon'>lon</label>     <input name='lon'   value='%0.6f'                      /> <br />\n", $info->longitude);
	printf ("\t\t\t<label for='msg'>msg</label>     <input name='msg'   value='$info->message'             /> <br />\n");
	printf ("\t\t\t<label for='route'>route</label> <input name='route' value='$info->route'               /> <br />\n");
	printf ("\t\t\t<label for='start'>start</label> <input name='start' value='$info->date_route'          /> <br />\n");
	printf ("\t\t\t<label for='wp'>wp</label>       <input name='wp'    value='$info->wp'                  /> <br />\n");
	printf ("\t\t\t<label for='pc'>&#37;age</label> <input name='pc'    value='$info->percentage' readonly /> <br />\n");

	printf ("\t\t\t<input type='submit' value='Save'></input>\n");

	printf ("		</form>\n");
	printf ("	</body>\n");
	printf ("</html>\n");
}

function create_calendar($day, $month, $year)
{
	/* draw table */
	$calendar = '<table border="1" cellpadding="1" cellspacing="0">';

	/* table headings */
	$headings = array('M','T','W','T','F','S','S');
	$calendar .= '<tr><td>'.implode('</td><td>', $headings).'</td></tr>';

	/* days and weeks vars now ... */
	$running_day   = date('N', mktime(0, 0, 0, $month, 1, $year))-1;
	$days_in_month = date('t', mktime(0, 0, 0, $month, 1, $year));
	$days_in_this_week = 1;
	$day_counter = 0;
	$dates_array = array();

	/* row for week one */
	$calendar .= '<tr>';

	/* print "blank" days until the first of the current week */
	for($x = 0; $x < $running_day; $x++) {
		$calendar .= '<td>&nbsp;</td>';
		$days_in_this_week++;
	}

	/* keep going with days.... */
	for($list_day = 1; $list_day <= $days_in_month; $list_day++) {
		/* add in the day number */
		if ($list_day == $day) {
			$calendar .= '<td style="background: red; color: white; font-weight: bold;">';
		} else {
			$calendar .= '<td>';
		}
		$calendar .= $list_day;
		$calendar .= '</td>';

		if($running_day == 6) {
			$calendar .= '</tr>';
			if(($day_counter+1) != $days_in_month) {
				$calendar .= '<tr>';
			}
			$running_day = -1;
			$days_in_this_week = 0;
		}
		$days_in_this_week++; $running_day++; $day_counter++;
	}

	/* finish the rest of the days in the week */
	if($days_in_this_week < 8) {
		for($x = 1; $x <= (8 - $days_in_this_week); $x++) {
			$calendar .= '<td>&nbsp;</td>';
		}
	}

	$calendar .= '</tr></table>';
	return $calendar;
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

	if (empty ($wp)){
		decode_dashed ($latitude);
		decode_dashed ($longitude);
	} else if ($wp == "home") {
		$latitude  = "51.763233";
		$longitude = "-1.269283";
		$wp        = "";
	} else if (ctype_alpha ($wp[0])) {
		if (geo_lookup ($wp, $latitude, $longitude) === true) {
		}
		$wp = "";
	}

	if (valid_coords ($latitude, $longitude)) {
		$info->latitude  = $latitude;
		$info->longitude = $longitude;
	}

	if (valid_route ($route)) {
		$info->route = $route;
	}

	$info->wp = "";
	if (($wp !== false) && !empty ($wp)) {
		if (get_waypoint ($info->route, $wp, $info->latitude, $info->longitude, $info->percentage)) {
			$info->wp = $wp;
		} else {
			$wp = "invalid";
		}
	} else {
		$info->percentage = 0;
	}

	$info->date_seen = valid_date ($date_seen);

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

	if (!isset ($info->date_bed))   $info->date_bed   = "";
	if (!isset ($info->latitude))   $info->latitude   = "";
	if (!isset ($info->longitude))  $info->longitude  = "";
	if (!isset ($info->message))    $info->message    = "";
	if (!isset ($info->route))      $info->route      = "";
	if (!isset ($info->date_route)) $info->date_route = "";
	if (!isset ($info->percentage)) $info->percentage = "";

	put_json ($info);

	create_form ($info);

	$date  = getdate();
	$day   = $date['mday'];
	$month = $date['mon'];
	$year  = $date['year'];
	$names = array ("January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December");

	$month--;
	if ($month == 0) {
		$month = 12;
		$year--;
	}

	echo '<div style="float: left; margin-right: 1em;">';
	echo "<b>${names[$month-1]} $year</b>";
	echo create_calendar(0, $month, $year);
	echo '</div>';

	$month++;
	if ($month == 13) {
		$month = 1;
		$year++;
	}

	echo '<div style="float: left; margin-right: 1em;">';
	echo "<b>${names[$month-1]} $year</b>";
	echo create_calendar($day, $month, $year);
	echo '</div>';

	$month++;
	if ($month == 13) {
		$month = 1;
		$year++;
	}

	echo '<div style="float: left; margin-right: 1em;">';
	echo "<b>${names[$month-1]} $year</b>";
	echo create_calendar(0, $month, $year);
	echo '</div>';
}


date_default_timezone_set('Europe/London');

main();

