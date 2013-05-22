#!/bin/bash

JSON="rich.json"
ROUTE_DIR="routes"
ROUTE_XML="route.xml"
ROUTE_TITLE="title.txt"

function get_var()
{
	local V=$1
	local LINE

	LINE=$(grep -m 1 "^[[:space:]]*\"$V\":" $JSON | cut -d: -f2- | sed 's/^[ \t]*"*\([^"]*\)"*,*[ \t]*$/\1/')

	echo "$LINE"
}

function float_eval()
{
	local CALC=$1
	echo "scale=6; $CALC" | bc
}

function date_diff()
{
	local d1=$1
	local d2=$2

	d1=$(date "+%s" -d "$d1")
	d2=$(date "+%s" -d "$d2")

	echo $(((d2-d1)/86400))
}


DATE_ROUTE="$(get_var date_route)"
DATE_SEEN="$(get_var date_seen)"
ROUTE="$(get_var route)"
WAYPOINT="$(get_var wp)"

NUM_WAYPOINTS="$(grep -c "<Point" "$ROUTE_DIR/$ROUTE/$ROUTE_XML")"
ROUTE_LENGTH="$(sed -n 4p "$ROUTE_DIR/$ROUTE/$ROUTE_TITLE")"

TODAY="$(date '+%Y-%m-%d')"
HOUR="$(date '+%H')"

[ $HOUR -lt 8  ] && HOUR=8
[ $HOUR -gt 18 ] && HOUR=18

TIME_WALKING=$(float_eval "($HOUR-8)/10")

#echo $DATE_SEEN
#echo $TODAY

#echo $(date_diff $DATE_ROUTE $DATE_SEEN)

SPEED1="$(($WAYPOINT/$(date_diff $DATE_ROUTE $DATE_SEEN)))"

echo "SPEED1 = $SPEED1 waypoints/day"

SPEED2="$((($ROUTE_LENGTH*$WAYPOINT/$NUM_WAYPOINTS)/$(date_diff $DATE_ROUTE $DATE_SEEN)))"

echo "SPEED2 = $SPEED2 miles/day"

POSN1="$((100*$WAYPOINT/$NUM_WAYPOINTS))"

echo "POSN1 = $POSN1% done"

FUTURE="$(date_diff $DATE_SEEN $TODAY)"
FUTURE="$(float_eval "$FUTURE+$TIME_WALKING")"
#echo FUTURE=$FUTURE

POSN2="$(float_eval "($FUTURE*$SPEED1)+$WAYPOINT")"
POSN2="${POSN2%.*}"

echo "POSN2 = WP$POSN2 estimated WP"

COORDS=$(grep -w WP$POSN2 $ROUTE_DIR/$ROUTE/$ROUTE_XML)

E_LAT="$(float_eval $(echo $COORDS | sed 's/.*North="\([^"]\+\).*/\1\/23860929/'))"
E_LON="$(float_eval $(echo $COORDS | sed 's/.*East="\([^"]\+\).*/\1\/11930465/'))"

echo E_LAT = $E_LAT
echo E_LON = $E_LON

echo "estimate = {"
echo "    \"wp\": \"$POSN2\","
echo "    \"latitude\": $E_LAT,"
echo "    \"longitude\": $E_LON"
echo "}"

