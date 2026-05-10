#!/usr/bin/env python3
"""Generate shattered circle polygons for selected AC Transit routes."""

import json
import math
import os
import time
from collections import defaultdict

import geopandas as gpd
import networkx as nx
import osmnx as ox
from shapely.geometry import Point, mapping
from shapely.ops import unary_union

RADIUS = 800
TARGET_ROUTES = {'9', '28', '34', 'E', 'V'}
OUTPUT_FILE = '/home/ubuntu/eastbay-storymap/site/data/shattered_circles.geojson'
STOPS_FILE = '/home/ubuntu/eastbay-storymap/site/data/all_bus_stops.geojson'

ox.settings.use_cache = True
ox.settings.cache_folder = '/home/ubuntu/eastbay-storymap/osmnx_cache'
ox.settings.log_console = False

def compute_polygon(lat, lon):
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
            for n, data in G_proj.nodes(data=True) if n in reachable
        ]
        if len(node_pts) > 2:
            net_poly = unary_union(node_pts).convex_hull
            re_ratio = net_poly.area / (math.pi * RADIUS ** 2)
            poly_gdf = gpd.GeoDataFrame(geometry=[net_poly], crs=crs).to_crs("EPSG:4326")
            return mapping(poly_gdf.geometry.iloc[0]), round(re_ratio, 4)
    except Exception as e:
        print(f"    Error: {e}", flush=True)
    return None, None

def main():
    print("Loading stops...", flush=True)
    with open(STOPS_FILE) as f:
        stops_data = json.load(f)

    route_stops = defaultdict(list)
    for feat in stops_data['features']:
        route = feat['properties']['route']
        if route not in TARGET_ROUTES:
            continue
        lon, lat = feat['geometry']['coordinates']
        name = feat['properties'].get('stop_name', 'Unknown')
        route_stops[route].append({'lat': lat, 'lon': lon, 'name': name})

    for r in TARGET_ROUTES:
        print(f"  Route {r}: {len(route_stops.get(r, []))} stops", flush=True)

    # Deduplicate by coordinate
    poly_cache = {}
    all_new_features = []
    total = sum(len(v) for v in route_stops.values())
    processed = 0
    start = time.time()

    for route in sorted(TARGET_ROUTES):
        stops = route_stops[route]
        print(f"\nProcessing Route {route} ({len(stops)} stops)...", flush=True)

        for si, stop in enumerate(stops):
            coord_key = f"{stop['lat']:.4f}:{stop['lon']:.4f}"

            if coord_key in poly_cache:
                geom, re_ratio = poly_cache[coord_key]
            else:
                geom, re_ratio = compute_polygon(stop['lat'], stop['lon'])
                poly_cache[coord_key] = (geom, re_ratio)

            if geom is not None:
                all_new_features.append({
                    'type': 'Feature',
                    'properties': {
                        'route': route,
                        'stop': stop['name'],
                        're_ratio': re_ratio
                    },
                    'geometry': geom
                })

            processed += 1
            if processed % 5 == 0:
                elapsed = time.time() - start
                rate = processed / elapsed
                left = (total - processed) / rate
                print(f"  [{si+1}/{len(stops)}] {stop['name'][:35]} "
                      f"Re={re_ratio} | {processed}/{total} ({rate:.2f}/s, ~{left/60:.0f}m left)",
                      flush=True)

    # Merge with existing
    with open(OUTPUT_FILE) as f:
        existing = json.load(f)

    merged = {
        'type': 'FeatureCollection',
        'features': existing['features'] + all_new_features
    }

    with open(OUTPUT_FILE, 'w') as f:
        json.dump(merged, f)

    elapsed = time.time() - start
    print(f"\nDone! {len(existing['features'])} existing + {len(all_new_features)} new = {len(merged['features'])} total", flush=True)
    print(f"Time: {elapsed/60:.1f} minutes", flush=True)

if __name__ == '__main__':
    main()
