#!/usr/bin/env python3
"""
Compute population and race demographics for each shattered circle polygon
using Census 2020 block group data (P1 table for race).
Outputs demographics.json for the site.
"""

import json
import requests
import geopandas as gpd
import pandas as pd
from shapely.geometry import shape, mapping
from shapely.ops import unary_union
import numpy as np
import os
import sys

# Census API - no key needed for small requests
CENSUS_BASE = "https://api.census.gov/data/2020/dec/pl"

# Variables: P1_001N=Total, P1_003N=White, P1_004N=Black, P1_005N=AIAN,
# P1_006N=Asian, P1_007N=NHPI, P1_008N=Other, P1_009N=Two+
RACE_VARS = "P1_001N,P1_003N,P1_004N,P1_005N,P1_006N,P1_007N,P1_008N,P1_009N"

# FIPS: California=06, Alameda=001, Contra Costa=013
COUNTIES = [("06", "001"), ("06", "013")]

def download_census_data():
    """Download block group population and race data for Alameda + Contra Costa."""
    all_rows = []
    for state, county in COUNTIES:
        url = f"{CENSUS_BASE}?get={RACE_VARS},NAME&for=block%20group:*&in=state:{state}%20county:{county}"
        print(f"Fetching Census data for state={state}, county={county}...")
        resp = requests.get(url)
        if resp.status_code != 200:
            print(f"  Error: {resp.status_code} {resp.text[:200]}")
            continue
        data = resp.json()
        header = data[0]
        for row in data[1:]:
            all_rows.append(dict(zip(header, row)))
        print(f"  Got {len(data)-1} block groups")
    return all_rows

def download_block_group_shapes():
    """Download block group boundaries from Census TIGER/Line."""
    cache_file = "/home/ubuntu/eastbay-storymap/census_bg_shapes.geojson"
    if os.path.exists(cache_file):
        print("Loading cached block group shapes...")
        return gpd.read_file(cache_file)
    
    frames = []
    for state, county in COUNTIES:
        county_name = "Alameda" if county == "001" else "Contra Costa"
        # Use Census TIGER WMS - Layer 8 = Block Groups (not Layer 10 = Blocks)
        url = f"https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/tigerWMS_Census2020/MapServer/8/query"
        params = {
            "where": f"STATE='{state}' AND COUNTY='{county}'",
            "outFields": "GEOID,STATE,COUNTY,TRACT,BLKGRP,AREALAND",
            "returnGeometry": "true",
            "f": "geojson",
            "outSR": "4326",
            "resultRecordCount": 2000
        }
        print(f"Fetching block group shapes for {county_name} County...")
        resp = requests.get(url, params=params)
        if resp.status_code != 200:
            print(f"  Error: {resp.status_code}")
            continue
        gj = resp.json()
        print(f"  Got {len(gj.get('features', []))} block group shapes")
        if gj.get('features'):
            gdf = gpd.GeoDataFrame.from_features(gj['features'], crs="EPSG:4326")
            frames.append(gdf)
    
    if not frames:
        print("ERROR: No block group shapes downloaded")
        sys.exit(1)
    
    bg_gdf = pd.concat(frames, ignore_index=True)
    bg_gdf.to_file(cache_file, driver="GeoJSON")
    print(f"Saved {len(bg_gdf)} block group shapes to cache")
    return bg_gdf

def compute_polygon_demographics(polygons_file, bg_gdf, census_data):
    """For each shattered circle polygon, compute population and race breakdown."""
    
    # Load shattered circles
    with open(polygons_file) as f:
        sc_data = json.load(f)
    
    # Build census lookup by GEOID
    census_lookup = {}
    for row in census_data:
        geoid = f"{row['state']}{row['county']}{row['tract']}{row['block group']}"
        census_lookup[geoid] = {
            'total': int(row['P1_001N']),
            'white': int(row['P1_003N']),
            'black': int(row['P1_004N']),
            'aian': int(row['P1_005N']),
            'asian': int(row['P1_006N']),
            'nhpi': int(row['P1_007N']),
            'other': int(row['P1_008N']),
            'two_plus': int(row['P1_009N']),
        }
    
    # Ensure bg_gdf has GEOID column
    if 'GEOID' not in bg_gdf.columns:
        print("Available columns:", bg_gdf.columns.tolist())
        sys.exit(1)
    
    # Project to meters for area calculations
    bg_proj = bg_gdf.to_crs("EPSG:3857")
    bg_proj['area_m2'] = bg_proj.geometry.area
    
    results = {}  # key: "route:stop_name" -> demographics
    
    total = len(sc_data['features'])
    for i, feature in enumerate(sc_data['features']):
        props = feature['properties']
        route = props.get('route', '')
        stop = props.get('stop', '')
        key = f"{route}:{stop}"
        
        if i % 50 == 0:
            print(f"  Processing polygon {i+1}/{total}...")
        
        try:
            poly = shape(feature['geometry'])
            if not poly.is_valid:
                poly = poly.buffer(0)
            
            # Find intersecting block groups
            poly_gdf = gpd.GeoDataFrame(geometry=[poly], crs="EPSG:4326")
            poly_proj = poly_gdf.to_crs("EPSG:3857")
            poly_area = poly_proj.geometry[0].area
            
            # Spatial intersection
            intersecting = bg_gdf[bg_gdf.intersects(poly)]
            
            if len(intersecting) == 0:
                results[key] = {
                    'population': 0,
                    'pop_density': 0,
                    'white': 0, 'black': 0, 'asian': 0,
                    'hispanic': 0, 'other': 0,
                    'poly_area_acres': poly_area * 0.000247105
                }
                continue
            
            # Area-weighted population
            pop_total = 0
            race_totals = {'white': 0, 'black': 0, 'aian': 0, 'asian': 0, 'nhpi': 0, 'other': 0, 'two_plus': 0}
            
            for _, bg_row in intersecting.iterrows():
                geoid = bg_row['GEOID']
                if geoid not in census_lookup:
                    continue
                
                cd = census_lookup[geoid]
                bg_geom = bg_row.geometry
                
                # Compute intersection area ratio
                intersection = poly.intersection(bg_geom)
                if intersection.is_empty:
                    continue
                
                # Project intersection for area
                int_gdf = gpd.GeoDataFrame(geometry=[intersection], crs="EPSG:4326").to_crs("EPSG:3857")
                int_area = int_gdf.geometry[0].area
                
                bg_proj_geom = bg_proj[bg_proj['GEOID'] == geoid]
                if len(bg_proj_geom) == 0:
                    continue
                bg_area = bg_proj_geom.iloc[0]['area_m2']
                
                if bg_area <= 0:
                    continue
                
                ratio = min(int_area / bg_area, 1.0)
                
                pop_total += cd['total'] * ratio
                for race_key in race_totals:
                    race_totals[race_key] += cd[race_key] * ratio
            
            pop_total = round(pop_total)
            poly_area_acres = poly_area * 0.000247105
            pop_density = pop_total / poly_area_acres if poly_area_acres > 0 else 0
            
            # Combine smaller categories
            results[key] = {
                'population': pop_total,
                'pop_density': round(pop_density, 1),
                'white': round(race_totals['white']),
                'black': round(race_totals['black']),
                'asian': round(race_totals['asian']),
                'aian': round(race_totals['aian']),
                'nhpi': round(race_totals['nhpi']),
                'other': round(race_totals['other']),
                'two_plus': round(race_totals['two_plus']),
                'poly_area_acres': round(poly_area_acres, 2)
            }
        except Exception as e:
            print(f"  Error processing {key}: {e}")
            results[key] = {
                'population': 0, 'pop_density': 0,
                'white': 0, 'black': 0, 'asian': 0,
                'aian': 0, 'nhpi': 0, 'other': 0, 'two_plus': 0,
                'poly_area_acres': 0
            }
    
    return results

def main():
    polygons_file = "/home/ubuntu/eastbay-storymap/site/data/shattered_circles.geojson"
    output_file = "/home/ubuntu/eastbay-storymap/site/data/demographics.json"
    
    # Step 1: Download census data
    census_data = download_census_data()
    print(f"Total census block groups: {len(census_data)}")
    
    # Step 2: Download block group shapes
    bg_gdf = download_block_group_shapes()
    print(f"Total block group shapes: {len(bg_gdf)}")
    
    # Step 3: Compute demographics for each polygon
    print("Computing demographics for each polygon...")
    results = compute_polygon_demographics(polygons_file, bg_gdf, census_data)
    
    # Step 4: Save
    with open(output_file, 'w') as f:
        json.dump(results, f)
    
    print(f"\nDone! Saved demographics for {len(results)} polygons to {output_file}")
    
    # Print some stats
    pops = [v['population'] for v in results.values() if v['population'] > 0]
    if pops:
        print(f"Population range: {min(pops)} - {max(pops)}, median: {sorted(pops)[len(pops)//2]}")

if __name__ == "__main__":
    main()
