#!/usr/bin/env python3
"""Generate all_bus_stops.geojson with stops for every AC Transit route from GTFS data."""

import csv
import json
from collections import defaultdict

GTFS_DIR = "/home/ubuntu/attachments"
STOPS_FILE = f"{GTFS_DIR}/ebbec47b-f961-4e71-952d-da9940093878/stops.txt"
TRIPS_FILE = f"{GTFS_DIR}/f9dd4290-4eb4-43ca-88a1-87030e984797/trips.txt"
STOP_TIMES_FILE = f"{GTFS_DIR}/c27cea64-7a75-4689-8f79-cbdbd1b9f86b/stop_times.txt"
ROUTES_FILE = f"{GTFS_DIR}/e1b50379-72e3-4806-a22a-d3ad159df148/routes.txt"
EXISTING_ROUTES = "/home/ubuntu/eastbay-storymap/site/data/all_bus_routes.geojson"
OUTPUT = "/home/ubuntu/eastbay-storymap/site/data/all_bus_stops.geojson"

# East Bay filter
EB_MIN_LAT = 37.69
EB_MIN_LON = -122.38

# Load routes for color info
with open(EXISTING_ROUTES) as f:
    routes_geojson = json.load(f)

route_colors = {}
for feat in routes_geojson['features']:
    route_colors[feat['properties']['route']] = feat['properties'].get('color', '#999')

# Load route info from GTFS
route_names = {}
with open(ROUTES_FILE, newline='', encoding='utf-8-sig') as f:
    reader = csv.DictReader(f)
    for row in reader:
        route_names[row['route_id']] = row['route_short_name']

# Load stops
stops = {}
with open(STOPS_FILE, newline='', encoding='utf-8-sig') as f:
    reader = csv.DictReader(f)
    for row in reader:
        stop_id = row['stop_id']
        lat = float(row['stop_lat'])
        lon = float(row['stop_lon'])
        stops[stop_id] = {
            'name': row['stop_name'],
            'lat': lat,
            'lon': lon
        }

# Map trip_id -> route_id
trip_route = {}
with open(TRIPS_FILE, newline='', encoding='utf-8-sig') as f:
    reader = csv.DictReader(f)
    for row in reader:
        trip_route[row['trip_id']] = row['route_id']

# Map route -> set of stop_ids
route_stops = defaultdict(set)
with open(STOP_TIMES_FILE, newline='', encoding='utf-8-sig') as f:
    reader = csv.DictReader(f)
    for row in reader:
        trip_id = row['trip_id']
        stop_id = row['stop_id']
        route_id = trip_route.get(trip_id)
        if route_id:
            route_name = route_names.get(route_id, route_id)
            route_stops[route_name].add(stop_id)

# Build GeoJSON
features = []
total_stops = 0
eb_stops = 0

for route_name, stop_ids in sorted(route_stops.items()):
    color = route_colors.get(route_name, '#999')
    for stop_id in stop_ids:
        if stop_id not in stops:
            continue
        s = stops[stop_id]
        total_stops += 1
        # Filter to East Bay
        if s['lat'] < EB_MIN_LAT or s['lon'] < EB_MIN_LON:
            continue
        eb_stops += 1
        features.append({
            'type': 'Feature',
            'geometry': {
                'type': 'Point',
                'coordinates': [s['lon'], s['lat']]
            },
            'properties': {
                'route': route_name,
                'stop_name': s['name'],
                'stop_id': stop_id,
                'color': color
            }
        })

geojson = {
    'type': 'FeatureCollection',
    'features': features
}

with open(OUTPUT, 'w') as f:
    json.dump(geojson, f)

print(f"Total stops across all routes: {total_stops}")
print(f"East Bay stops: {eb_stops}")
print(f"Routes with stops: {len(route_stops)}")
print(f"Output: {OUTPUT}")
