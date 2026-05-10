#!/usr/bin/env python3
"""
Generate shattered circle polygons for specific control locations.
These are NOT bus stops — they're manually specified coordinates for the walkthrough.
"""

import json
import osmnx as ox
import networkx as nx
import numpy as np
from shapely.geometry import mapping, MultiPoint
from shapely.ops import unary_union
import math
import sys

WALK_RADIUS = 800  # meters

CONTROL_SITES = [
    {
        "name": "Channing x California",
        "lat": 37.864360330851504,
        "lon": -122.2790346887757,
        "route": "CONTROL",
        "stop": "Channing x California, Berkeley"
    },
    {
        "name": "Ohlone Greenway",
        "lat": 37.88314546283414,
        "lon": -122.29071715774252,
        "route": "CONTROL",
        "stop": "Ohlone Greenway"
    },
    {
        "name": "Jack London Square",
        "lat": 37.795145,
        "lon": -122.276890,
        "route": "CONTROL",
        "stop": "Jack London Square, Oakland"
    }
]

def compute_shattered_circle(G, lat, lon, radius=WALK_RADIUS):
    """Compute the shattered circle (convex hull of reachable street nodes) from a point."""
    try:
        nearest_node = ox.nearest_nodes(G, lon, lat)
        subgraph = nx.ego_graph(G, nearest_node, radius=radius, distance='length')
        
        if len(subgraph.nodes) < 3:
            return None, 0.0
        
        points = []
        for node in subgraph.nodes:
            points.append((G.nodes[node]['x'], G.nodes[node]['y']))
        
        mp = MultiPoint(points)
        hull = mp.convex_hull
        
        # Calculate R_e ratio
        full_circle_area = math.pi * radius * radius
        # Project to get area in meters using geopandas
        import geopandas as gpd_temp
        hull_gdf = gpd_temp.GeoDataFrame(geometry=[hull], crs="EPSG:4326").to_crs("EPSG:3857")
        hull_area = hull_gdf.geometry[0].area
        
        re_ratio = hull_area / full_circle_area if full_circle_area > 0 else 0
        re_ratio = min(re_ratio, 1.0)
        
        return hull, re_ratio
    except Exception as e:
        print(f"  Error computing polygon: {e}")
        return None, 0.0

def main():
    polygons_file = "/home/ubuntu/eastbay-storymap/site/data/shattered_circles.geojson"
    
    # Load existing polygons
    with open(polygons_file) as f:
        existing = json.load(f)
    
    print(f"Existing polygons: {len(existing['features'])}")
    
    # Remove any existing CONTROL features
    existing['features'] = [f for f in existing['features'] if f['properties'].get('route') != 'CONTROL']
    print(f"After removing old CONTROL features: {len(existing['features'])}")
    
    new_features = []
    for site in CONTROL_SITES:
        print(f"\nProcessing {site['name']}...")
        # Download a local graph for each site to ensure full coverage
        print(f"  Downloading walking network around ({site['lat']:.4f}, {site['lon']:.4f})...")
        G = ox.graph_from_point((site['lat'], site['lon']), dist=1500, network_type='walk')
        print(f"  Graph: {len(G.nodes)} nodes, {len(G.edges)} edges")
        hull, re_ratio = compute_shattered_circle(G, site['lat'], site['lon'])
        
        if hull is None:
            print(f"  FAILED - no polygon generated")
            continue
        
        print(f"  R_e = {re_ratio:.4f}")
        
        feature = {
            "type": "Feature",
            "properties": {
                "route": site['route'],
                "stop": site['stop'],
                "re_ratio": round(re_ratio, 6),
                "stop_lat": site['lat'],
                "stop_lon": site['lon']
            },
            "geometry": mapping(hull)
        }
        new_features.append(feature)
    
    # Add new features
    existing['features'].extend(new_features)
    
    # Save
    with open(polygons_file, 'w') as f:
        json.dump(existing, f)
    
    print(f"\nDone! Added {len(new_features)} control polygons. Total: {len(existing['features'])}")

if __name__ == "__main__":
    main()
