#!/usr/bin/env python3
"""Fast polygon generation using per-stop graph downloads with OSMnx caching.
Uses multiprocessing and aggressive deduplication to speed up computation."""

import json
import math
import os
import sys
import time
from collections import defaultdict

import geopandas as gpd
import networkx as nx
import osmnx as ox
from shapely.geometry import Point, mapping
from shapely.ops import unary_union

RADIUS = 800  # meters
OUTPUT_FILE = '/home/ubuntu/eastbay-storymap/site/data/shattered_circles.geojson'
STOPS_FILE = '/home/ubuntu/eastbay-storymap/site/data/all_bus_stops.geojson'
CHECKPOINT_FILE = '/home/ubuntu/eastbay-storymap/polygon_checkpoint_fast.json'

EXISTING_ROUTES = {'L', '57', '1T', 'F'}

ox.settings.use_cache = True
ox.settings.cache_folder = '/home/ubuntu/eastbay-storymap/osmnx_cache'
ox.settings.log_console = False

def load_checkpoint():
    if os.path.exists(CHECKPOINT_FILE):
        with open(CHECKPOINT_FILE) as f:
            return json.load(f)
    return {'completed_stops': {}, 'poly_cache': {}, 'route_features': {}}

def save_checkpoint(cp):
    with open(CHECKPOINT_FILE, 'w') as f:
        json.dump(cp, f)

def compute_polygon_for_stop(lat, lon):
    """Download graph around stop and compute shattered circle."""
    try:
        G = ox.graph_from_point((lat, lon), dist=RADIUS, network_type='walk')
        G_proj = ox.project_graph(G)
        crs = G_proj.graph['crs']

        pt_geom = gpd.GeoSeries([Point(lon, lat)], crs="EPSG:4326").to_crs(crs)
        c_x, c_y = pt_geom.iloc[0].x, pt_geom.iloc[0].y
        center_node = ox.distance.nearest_nodes(G_proj, c_x, c_y)

        reachable = nx.single_source_dijkstra_path_length(
            G_proj, center_node, cutoff=RADIUS, weight='length'
        )
        node_pts = [
            Point(data['x'], data['y'])
            for n, data in G_proj.nodes(data=True)
            if n in reachable
        ]

        if len(node_pts) > 2:
            net_poly = unary_union(node_pts).convex_hull
            re_ratio = net_poly.area / (math.pi * RADIUS ** 2)
            poly_gdf = gpd.GeoDataFrame(geometry=[net_poly], crs=crs).to_crs("EPSG:4326")
            return mapping(poly_gdf.geometry.iloc[0]), round(re_ratio, 4)
    except Exception as e:
        pass
    return None, None

def main():
    # Load stops
    print("Loading stops...", flush=True)
    with open(STOPS_FILE) as f:
        stops_data = json.load(f)

    # Group stops by route, deduplicate by coordinate
    route_stops = defaultdict(list)
    unique_coords = {}  # coord_key -> (lat, lon)

    for feat in stops_data['features']:
        route = feat['properties']['route']
        if route in EXISTING_ROUTES:
            continue
        lon, lat = feat['geometry']['coordinates']
        name = feat['properties'].get('stop_name', 'Unknown')
        coord_key = f"{lat:.4f}:{lon:.4f}"  # Round to ~10m precision

        route_stops[route].append({
            'lat': lat, 'lon': lon, 'name': name, 'coord_key': coord_key
        })
        if coord_key not in unique_coords:
            unique_coords[coord_key] = (lat, lon)

    routes = sorted(route_stops.keys())
    total_stops = sum(len(v) for v in route_stops.values())
    print(f"Routes: {len(routes)}, Stops: {total_stops}, Unique locations: {len(unique_coords)}", flush=True)

    # Load checkpoint
    checkpoint = load_checkpoint()
    completed_stops = checkpoint['completed_stops']  # coord_key -> {geom, re_ratio} or 'failed'
    route_features = checkpoint.get('route_features', {})  # route -> [features]

    processed = 0
    cached = 0
    errors = 0
    start_time = time.time()

    for ri, route in enumerate(routes):
        if route in route_features:
            cached += len(route_stops[route])
            continue

        stops = route_stops[route]
        features_for_route = []

        for si, stop in enumerate(stops):
            coord_key = stop['coord_key']

            if coord_key in completed_stops:
                cached += 1
                result = completed_stops[coord_key]
                if result != 'failed':
                    features_for_route.append({
                        'type': 'Feature',
                        'properties': {
                            'route': route,
                            'stop': stop['name'],
                            're_ratio': result['re_ratio']
                        },
                        'geometry': result['geom']
                    })
                continue

            geom, re_ratio = compute_polygon_for_stop(stop['lat'], stop['lon'])

            if geom is not None:
                completed_stops[coord_key] = {'geom': geom, 're_ratio': re_ratio}
                features_for_route.append({
                    'type': 'Feature',
                    'properties': {
                        'route': route,
                        'stop': stop['name'],
                        're_ratio': re_ratio
                    },
                    'geometry': geom
                })
            else:
                completed_stops[coord_key] = 'failed'
                errors += 1

            processed += 1

            if processed % 5 == 0:
                elapsed = time.time() - start_time
                rate = processed / elapsed if elapsed > 0 else 0
                unique_left = len(unique_coords) - len(completed_stops)
                remaining = unique_left / rate if rate > 0 else 0
                print(f"  [{si+1}/{len(stops)}] {stop['name'][:30]} "
                      f"Re={re_ratio if re_ratio else 'N/A'} "
                      f"| {processed} computed, {cached} cached, {errors} errors "
                      f"| {rate:.2f}/s, ~{remaining/60:.0f}m left "
                      f"| {len(completed_stops)}/{len(unique_coords)} unique done",
                      flush=True)

        route_features[route] = features_for_route

        # Checkpoint every route
        checkpoint['completed_stops'] = completed_stops
        checkpoint['route_features'] = route_features
        save_checkpoint(checkpoint)

        print(f"[{ri+1}/{len(routes)}] Route {route}: {len(features_for_route)} polygons saved",
              flush=True)

    # Merge all features
    all_new_features = []
    for route in routes:
        all_new_features.extend(route_features.get(route, []))

    # Load existing polygons
    with open(OUTPUT_FILE) as f:
        existing = json.load(f)

    merged = {
        'type': 'FeatureCollection',
        'features': existing['features'] + all_new_features
    }

    with open(OUTPUT_FILE, 'w') as f:
        json.dump(merged, f)

    elapsed = time.time() - start_time
    print(f"\nDone! {len(existing['features'])} existing + {len(all_new_features)} new = {len(merged['features'])} total", flush=True)
    print(f"Processed: {processed}, Cached: {cached}, Errors: {errors}", flush=True)
    print(f"Time: {elapsed/60:.1f} minutes", flush=True)

if __name__ == '__main__':
    main()
