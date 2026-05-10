#!/usr/bin/env python3
"""Generate shattered circle polygons for all AC Transit bus stops.
Uses OSMnx walking network analysis with aggressive caching to avoid
redundant graph downloads for nearby stops."""

import json
import math
import os
import sys
import time
import traceback
from collections import defaultdict

import geopandas as gpd
import networkx as nx
import numpy as np
import osmnx as ox
from shapely.geometry import Point, mapping
from shapely.ops import unary_union

# Configuration
RADIUS = 800  # 0.5 mile in meters
GRAPH_CACHE_RADIUS = 1200  # Download slightly larger graphs for reuse
SNAP_THRESHOLD = 0.001  # ~100m in degrees - reuse graph if stop is this close

OUTPUT_DIR = '/home/ubuntu/eastbay-storymap/site/data'
CHECKPOINT_FILE = '/home/ubuntu/eastbay-storymap/polygon_checkpoint.json'
STOPS_FILE = '/home/ubuntu/eastbay-storymap/site/data/all_bus_stops.geojson'

# Routes that already have polygons
EXISTING_ROUTES = {'L', '57', '1T', 'F'}

ox.settings.use_cache = True
ox.settings.cache_folder = '/home/ubuntu/eastbay-storymap/osmnx_cache'
ox.settings.log_console = False

def load_checkpoint():
    if os.path.exists(CHECKPOINT_FILE):
        with open(CHECKPOINT_FILE) as f:
            return json.load(f)
    return {'completed': {}, 'features': []}

def save_checkpoint(checkpoint):
    with open(CHECKPOINT_FILE, 'w') as f:
        json.dump(checkpoint, f)

def compute_polygon(lat, lon, G_proj, crs):
    """Compute shattered circle polygon for a stop."""
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
        # Convert back to WGS84
        poly_gdf = gpd.GeoDataFrame(geometry=[net_poly], crs=crs).to_crs("EPSG:4326")
        return poly_gdf.geometry.iloc[0], re_ratio
    return None, None

def main():
    # Load stops
    with open(STOPS_FILE) as f:
        stops_data = json.load(f)

    # Group stops by route
    route_stops = defaultdict(list)
    for feat in stops_data['features']:
        route = feat['properties']['route']
        if route in EXISTING_ROUTES:
            continue
        lon, lat = feat['geometry']['coordinates']
        name = feat['properties'].get('stop_name', 'Unknown')
        route_stops[route].append({'lat': lat, 'lon': lon, 'name': name})

    routes = sorted(route_stops.keys())
    total_stops = sum(len(v) for v in route_stops.values())
    print(f"Processing {len(routes)} routes, {total_stops} stops total")

    # Load checkpoint
    checkpoint = load_checkpoint()
    completed = checkpoint['completed']
    all_features = checkpoint['features']

    # Graph cache: (lat_rounded, lon_rounded) -> (G_proj, crs)
    graph_cache = {}

    processed = 0
    skipped = 0
    errors = 0
    start_time = time.time()

    for ri, route in enumerate(routes):
        stops = route_stops[route]
        route_key = f"route_{route}"

        if route_key in completed:
            skipped += len(stops)
            continue

        print(f"\n[{ri+1}/{len(routes)}] Route {route}: {len(stops)} stops")
        route_features = []

        for si, stop in enumerate(stops):
            lat, lon, name = stop['lat'], stop['lon'], stop['name']
            stop_key = f"{route}:{name}:{lat:.5f}:{lon:.5f}"

            if stop_key in completed:
                skipped += 1
                continue

            try:
                # Check graph cache
                cache_key = (round(lat, 3), round(lon, 3))
                if cache_key in graph_cache:
                    G_proj, crs = graph_cache[cache_key]
                else:
                    G = ox.graph_from_point(
                        (lat, lon), dist=GRAPH_CACHE_RADIUS, network_type='walk'
                    )
                    G_proj = ox.project_graph(G)
                    crs = G_proj.graph['crs']
                    graph_cache[cache_key] = (G_proj, crs)

                poly, re_ratio = compute_polygon(lat, lon, G_proj, crs)

                if poly is not None:
                    feature = {
                        'type': 'Feature',
                        'properties': {
                            'route': route,
                            'stop': name,
                            're_ratio': round(re_ratio, 4)
                        },
                        'geometry': mapping(poly)
                    }
                    route_features.append(feature)
                    all_features.append(feature)

                completed[stop_key] = True
                processed += 1

                if processed % 10 == 0:
                    elapsed = time.time() - start_time
                    rate = processed / elapsed if elapsed > 0 else 0
                    remaining = (total_stops - processed - skipped) / rate if rate > 0 else 0
                    print(f"  [{si+1}/{len(stops)}] {name} Re={re_ratio:.4f if re_ratio else 'N/A'}"
                          f" | Total: {processed}/{total_stops} ({rate:.1f}/s, ~{remaining/60:.0f}m left)")

            except Exception as e:
                errors += 1
                completed[stop_key] = True  # Skip on retry
                if errors <= 5:
                    print(f"  Error at {name}: {e}")
                continue

        # Mark route complete
        completed[route_key] = True

        # Checkpoint every route
        checkpoint['completed'] = completed
        checkpoint['features'] = all_features
        save_checkpoint(checkpoint)
        print(f"  Route {route} done: {len(route_features)} polygons. Checkpoint saved.")

    # Final output
    print(f"\n{'='*60}")
    print(f"Processed: {processed}, Skipped: {skipped}, Errors: {errors}")
    print(f"Total polygons: {len(all_features)}")

    # Load existing polygons and merge
    existing_file = os.path.join(OUTPUT_DIR, 'shattered_circles.geojson')
    with open(existing_file) as f:
        existing = json.load(f)

    # Merge: keep existing + add new
    merged = {
        'type': 'FeatureCollection',
        'features': existing['features'] + all_features
    }

    with open(existing_file, 'w') as f:
        json.dump(merged, f)

    print(f"Merged {len(existing['features'])} existing + {len(all_features)} new = {len(merged['features'])} total features")
    print(f"Saved to {existing_file}")

if __name__ == '__main__':
    main()
