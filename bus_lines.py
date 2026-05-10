import pandas as pd
import geopandas as gpd
import osmnx as ox
import networkx as nx
import math
import os
from shapely.geometry import Point

# --- 1. CONFIGURATION ---
# The Four Horsemen of East Bay Connectivity
TARGET_ROUTES = ['L', '57', '1T', 'F']
RADIUS = 800  # The 0.5 mile 'Lived Reality' threshold

os.makedirs('outputs', exist_ok=True)

# Load GTFS (Ensure these are in your data/ folder)
print("📂 Loading GTFS Data...")
stops = pd.read_csv('data/stops.txt')
stop_times = pd.read_csv('data/stop_times.txt')
trips = pd.read_csv('data/trips.txt')
routes = pd.read_csv('data/routes.txt')

all_polygons = []
all_stats = []

# --- 2. THE CENSUS LOOP ---
for route_name in TARGET_ROUTES:
    print(f"\n🕵️ Starting Census for Route: {route_name}")
    
    try:
        # Match route name (ensuring it handles strings vs ints)
        route_match = routes[routes['route_short_name'].astype(str) == str(route_name)]
        if route_match.empty:
            print(f"⚠️ Could not find Route {route_name} in GTFS. Skipping.")
            continue
            
        route_id = route_match['route_id'].iloc[0]
        
        # Get all stops for a representative trip on this route
        sample_trip = trips[trips['route_id'] == route_id]['trip_id'].iloc[0]
        stop_ids = stop_times[stop_times['trip_id'] == sample_trip]['stop_id'].unique()
        line_stops = stops[stops['stop_id'].isin(stop_ids)]
        
        print(f"📍 Found {len(line_stops)} unique stops. Commencing Spatial Audit...")

        for i, (_, stop) in enumerate(line_stops.iterrows()):
            lat, lon, s_name = stop['stop_lat'], stop['stop_lon'], stop['stop_name']
            
            try:
                # Calculate Network Reach
                G = ox.graph_from_point((lat, lon), dist=RADIUS, network_type='walk')
                G_proj = ox.project_graph(G)
                
                # Re Calculation
                pt_geom = gpd.GeoSeries([Point(lon, lat)], crs="EPSG:4326").to_crs(G_proj.graph['crs'])
                c_x, c_y = pt_geom.iloc[0].x, pt_geom.iloc[0].y
                center_node = ox.distance.nearest_nodes(G_proj, c_x, c_y)
                
                # Dijkstra for 800m
                reachable = nx.single_source_dijkstra_path_length(G_proj, center_node, cutoff=RADIUS, weight='length')
                node_pts = [Point(data['x'], data['y']) for n, data in G_proj.nodes(data=True) if n in reachable]
                
                # Generate 'Shattered Circle'
                if len(node_pts) > 2:
                    net_poly = gpd.GeoSeries(node_pts).union_all().convex_hull
                    re_ratio = net_poly.area / (math.pi * RADIUS**2)
                    
                    all_stats.append({
                        'route': route_name, 
                        'stop': s_name, 
                        're_ratio': round(re_ratio, 4), 
                        'lat': lat, 'lon': lon
                    })
                    all_polygons.append({
                        'geometry': net_poly, 
                        'route': route_name, 
                        'stop': s_name, 
                        're_ratio': re_ratio
                    })
                
                if (i + 1) % 5 == 0:
                    print(f"  ... {i+1}/{len(line_stops)} stops processed.")

            except Exception:
                continue

    except Exception as e:
        print(f"❌ Critical error on Route {route_name}: {e}")

# --- 3. THE GRAND EXPORT ---
if all_stats:
    # Save statistics for spreadsheet analysis
    df = pd.DataFrame(all_stats)
    df.to_csv("outputs/full_lines_census_results.csv", index=False)
    
    # Save geometries for QGIS visualization
    # We use the CRS of the last projected graph (usually UTM Zone 10N)
    gdf_polys = gpd.GeoDataFrame(all_polygons, crs=G_proj.graph['crs'])
    gdf_polys.to_file("outputs/full_lines_shattered_circles.gpkg", driver="GPKG")
    
    print(f"\n✅ FULL CENSUS COMPLETE.")
    print(f"📊 Analyzed {len(all_stats)} stops across {len(TARGET_ROUTES)} lines.")
else:
    print("❌ No data was generated. Check GTFS file paths.")