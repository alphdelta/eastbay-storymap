#!/usr/bin/env python3
"""Generate GeoJSON for ALL AC Transit bus routes from GTFS data."""
import csv
import json
import os

GTFS_DIR = {
    'routes': '/home/ubuntu/attachments/e1b50379-72e3-4806-a22a-d3ad159df148/routes.txt',
    'trips': '/home/ubuntu/attachments/f9dd4290-4eb4-43ca-88a1-87030e984797/trips.txt',
    'shapes': '/home/ubuntu/attachments/e17318c6-abb5-4821-9c01-cc2799f99202/shapes.txt',
    'stops': '/home/ubuntu/attachments/ebbec47b-f961-4e71-952d-da9940093878/stops.txt',
    'stop_times': '/home/ubuntu/attachments/c27cea64-7a75-4689-8f79-cbdbd1b9f86b/stop_times.txt',
}

OUT_DIR = '/home/ubuntu/eastbay-storymap/site/data'

# East Bay bounding box (exclude SF stops)
EAST_BAY_BBOX = {
    'min_lat': 37.69,
    'max_lat': 37.95,
    'min_lon': -122.38,
    'max_lon': -122.05,
}

# Main analysis routes
MAIN_ROUTES = {'L', '57', '1T', 'F'}

def load_csv(path):
    with open(path) as f:
        return list(csv.DictReader(f))

def in_east_bay(lat, lon):
    return (EAST_BAY_BBOX['min_lat'] <= lat <= EAST_BAY_BBOX['max_lat'] and
            EAST_BAY_BBOX['min_lon'] <= lon <= EAST_BAY_BBOX['max_lon'])

def main():
    print("Loading GTFS data...")
    routes = {r['route_id']: r for r in load_csv(GTFS_DIR['routes'])}
    trips = load_csv(GTFS_DIR['trips'])
    shapes_raw = load_csv(GTFS_DIR['shapes'])

    # Build shape geometries
    shapes = {}
    for s in shapes_raw:
        sid = s['shape_id']
        if sid not in shapes:
            shapes[sid] = []
        shapes[sid].append({
            'lat': float(s['shape_pt_lat']),
            'lon': float(s['shape_pt_lon']),
            'seq': int(s['shape_pt_sequence']),
        })
    
    # Sort each shape by sequence
    for sid in shapes:
        shapes[sid].sort(key=lambda p: p['seq'])

    # Map route_id -> set of shape_ids
    route_shapes = {}
    for t in trips:
        rid = t['route_id']
        sid = t['shape_id']
        if rid not in route_shapes:
            route_shapes[rid] = set()
        route_shapes[rid].add(sid)

    # For each route, pick the shape with the most points in East Bay
    features = []
    route_info = []
    
    for rid, rdata in sorted(routes.items(), key=lambda x: x[1]['route_short_name']):
        rname = rdata['route_short_name']
        rlong = rdata['route_long_name']
        rcolor = '#' + rdata['route_color'] if rdata.get('route_color') else '#888888'
        
        if rid not in route_shapes:
            continue
        
        # Pick best shape (most points)
        best_shape_id = max(route_shapes[rid], key=lambda s: len(shapes.get(s, [])))
        pts = shapes.get(best_shape_id, [])
        
        if len(pts) < 2:
            continue
        
        # Check if route has any points in East Bay
        eb_pts = [p for p in pts if in_east_bay(p['lat'], p['lon'])]
        if len(eb_pts) < 2:
            # Skip routes that don't pass through East Bay at all
            continue
        
        coords = [[p['lon'], p['lat']] for p in pts]
        
        is_main = rname in MAIN_ROUTES
        
        feature = {
            'type': 'Feature',
            'properties': {
                'route': rname,
                'long_name': rlong,
                'color': rcolor,
                'route_id': rid,
                'is_main': is_main,
            },
            'geometry': {
                'type': 'LineString',
                'coordinates': coords,
            }
        }
        features.append(feature)
        route_info.append({
            'route': rname,
            'long_name': rlong,
            'color': rcolor,
            'is_main': is_main,
            'num_points': len(pts),
        })
    
    # Write all routes GeoJSON
    geojson = {
        'type': 'FeatureCollection',
        'features': features,
    }
    
    out_path = os.path.join(OUT_DIR, 'all_bus_routes.geojson')
    with open(out_path, 'w') as f:
        json.dump(geojson, f)
    
    print(f"Written {len(features)} routes to {out_path}")
    print(f"  Main routes: {sum(1 for r in route_info if r['is_main'])}")
    print(f"  Other routes: {sum(1 for r in route_info if not r['is_main'])}")
    
    # Print summary
    for r in sorted(route_info, key=lambda x: (not x['is_main'], x['route'])):
        tag = " [MAIN]" if r['is_main'] else ""
        print(f"  {r['route']:6s} | {r['long_name'][:45]:45s} | {r['color']}{tag}")

    # Also identify SF stops to flag
    print("\nChecking for SF stops in main analysis...")
    stops_raw = load_csv(GTFS_DIR['stops'])
    sf_stops = [s for s in stops_raw if float(s['stop_lat']) < EAST_BAY_BBOX['min_lat'] 
                or float(s['stop_lon']) < EAST_BAY_BBOX['min_lon']]
    print(f"Found {len(sf_stops)} stops outside East Bay bbox")
    for s in sf_stops[:10]:
        print(f"  {s['stop_name']} ({s['stop_lat']}, {s['stop_lon']})")

if __name__ == '__main__':
    main()
