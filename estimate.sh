#!/bin/bash

cd ${0%/*}

JSON="rich.json"
ROUTE_DIR="routes"
ROUTE_XML="route.xml"
ROUTE_TITLE="title.txt"
ESTIMATE="estimate.json"
VERBOSE=0

[ "$1" = "-v" ] && VERBOSE=1

function get_var()
{
	grep -m 1 "^[[:space:]]*\"$1\":" $JSON | cut -d: -f2- | sed 's/^[ \t]*"*\([^"]*\)"*,*[ \t]*$/\1/'
}

function float_eval()
{
	echo "scale=6; $1" | bc
}

function date_diff()
{
	local d1=$1
	local d2=$2

	d1=$(date "+%s" -d "$d1")
	d2=$(date "+%s" -d "$d2")

	echo $(((d2-d1)/86400))
}

function exit_no_estimate()
{
	{
		echo "estimate = {"
		echo "}"
	} > $ESTIMATE
	chmod 644 $ESTIMATE
	exit 0
}

function exit_estimate()
{
	{
		echo "estimate = {"
		echo "    \"wp\": \"$POSN2\","
		echo "    \"latitude\": $E_LAT,"
		echo "    \"longitude\": $E_LON"
		echo "}"
	} > $ESTIMATE
	chmod 644 $ESTIMATE
	exit 0
}

function verbose()
{
	[ "$VERBOSE" = 1 ] || return
	echo "$@"
}


DATE_ROUTE="$(get_var date_route)"
DATE_SEEN="$(get_var date_seen)"
ROUTE="$(get_var route)"
WAYPOINT="$(get_var wp)"

[ -z "$DATE_ROUTE" ] && exit_no_estimate
[ -z "$DATE_SEEN"  ] && exit_no_estimate
[ -z "$ROUTE"      ] && exit_no_estimate
[ -z "$WAYPOINT"   ] && exit_no_estimate

NUM_WAYPOINTS="$(grep -c "<Point" "$ROUTE_DIR/$ROUTE/$ROUTE_XML")"
ROUTE_LENGTH="$(sed -n 4p "$ROUTE_DIR/$ROUTE/$ROUTE_TITLE")"

[ "$NUM_WAYPOINTS" -gt 0 ] || exit_no_estimate
[ "$ROUTE_LENGTH"  -gt 0 ] || exit_no_estimate

TODAY="$(date '+%Y-%m-%d')"
HOUR="$(date '+%H')"

[ "$HOUR" -lt  8 ] && HOUR=8
[ "$HOUR" -gt 18 ] && HOUR=18

TIME_WALKING=$(float_eval "($HOUR-8)/10")

SPEED1="$(($WAYPOINT/$(date_diff $DATE_ROUTE $DATE_SEEN)))"

verbose "SPEED1 = $SPEED1 waypoints/day"

[ "$SPEED1" -lt  20 ] && exit_no_estimate
[ "$SPEED1" -gt 500 ] && exit_no_estimate

SPEED2="$((($ROUTE_LENGTH*$WAYPOINT/$NUM_WAYPOINTS)/$(date_diff $DATE_ROUTE $DATE_SEEN)))"

verbose "SPEED2 = $SPEED2 miles/day"

[ "$SPEED2" -lt  5 ] && exit_no_estimate
[ "$SPEED2" -gt 30 ] && exit_no_estimate

POSN1="$((100*$WAYPOINT/$NUM_WAYPOINTS))"

verbose "POSN1 = $POSN1% done"

[ "$POSN1" -lt   0 ] && POSN1=0
[ "$POSN1" -gt 100 ] && POSN1=100

FUTURE="$(date_diff $DATE_SEEN $TODAY)"
FUTURE="$(float_eval "$FUTURE+$TIME_WALKING")"

verbose "FUTURE = $FUTURE"

POSN2="$(float_eval "($FUTURE*$SPEED1)+$WAYPOINT")"
POSN2="${POSN2%.*}"

[ "$POSN2" -gt "$NUM_WAYPOINTS" ] && $POSN2=$NUM_WAYPOINTS

verbose "POSN2 = WP$POSN2 estimated WP"

COORDS=$(grep -w WP$POSN2 $ROUTE_DIR/$ROUTE/$ROUTE_XML)

[ -z "$COORDS" ] && exit_no_estimate

E_LAT="$(float_eval $(echo $COORDS | sed 's/.*North="\([^"]\+\).*/\1\/23860929/'))"
E_LON="$(float_eval $(echo $COORDS | sed 's/.*East="\([^"]\+\).*/\1\/11930465/'))"

# Bounds of the UK
[ "${E_LAT%.*}" -lt 49 -o "${E_LAT%.*}" -gt 59 ] && exit_no_estimate
[ "${E_LON%.*}" -lt -8 -o "${E_LON%.*}" -gt  2 ] && exit_no_estimate

verbose "$E_LAT = $E_LAT"
verbose "$E_LON = $E_LON"

exit_estimate

