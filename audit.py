import pandas as pd
import geopandas as gpd
import osmnx as ox
import networkx as nx
import rasterio
import math
import os
from shapely.geometry import Point
from pyproj import Transformer

# --- 1. CONFIGURATION & DIRECTORIES ---
# Ensure your filenames in the 'data' folder match these exactly!
ROAD_NOISE_PATH = 'data/CONUS_road_noise_2020/State_rasters/CA_road_noise_2020.tif'
RAIL_NOISE_PATH = 'data/CONUS_rail_noise_2020/State_rasters/CA_rail_noise_2020.tif'
RADIUS = 800  # 0.5 miles in meters

# Create outputs folder if it doesn't exist
os.makedirs('outputs', exist_ok=True)

SITES = {
    "North_Berkeley_Portal_Open": [37.880069, -122.289374], # Shifted North to catch above-ground tracks
    "West_Oakland_Maze": [37.827096, -122.291246],
    "International_1T_Irrigation": [37.77619809416805, -122.22273926094171],
    "Berkeley_Flats_Control": [37.864317823176876, -122.27917410281135]
}
# --- 2. UPDATED NOISE SAMPLING (With Coordinate Transformation) ---
def get_noise_at_point(lat, lon, raster_src):
    try:
        # Create a transformer to match the raster's coordinate system (CRS)
        # From Lat/Lon (4326) to Raster CRS
        transformer = Transformer.from_crs("EPSG:4326", raster_src.crs, always_xy=True)
        new_x, new_y = transformer.transform(lon, lat)
        
        # Sample the raster at the transformed coordinates
        row, col = raster_src.index(new_x, new_y)
        val = raster_src.read(1)[row, col]
        
        # BTS noise maps use 'NoData' values (usually -127 or 0) for quiet areas
        return max(val, 0) if val > -100 else 0
    except Exception:
        return 0

# --- 3. MAIN AUDIT LOOP ---
results = []
polygons = []

print("🚀 Starting Comparative Forensic Audit...")

with rasterio.open(ROAD_NOISE_PATH) as road_src, \
     rasterio.open(RAIL_NOISE_PATH) as rail_src:
    
    for name, coords in SITES.items():
        lat, lon = coords[0], coords[1]
        print(f"🧐 Auditing Site: {name}...")
        
        try:
            # A. Network Logic
            G = ox.graph_from_point((lat, lon), dist=RADIUS, network_type='walk')
            G_proj = ox.project_graph(G)
            
            # Find center node in projected coordinates
            point_geom = gpd.GeoSeries([Point(lon, lat)], crs="EPSG:4326").to_crs(G_proj.graph['crs'])
            c_x, c_y = point_geom.iloc[0].x, point_geom.iloc[0].y
            center_node = ox.distance.nearest_nodes(G_proj, c_x, c_y)
            
            # Dijkstra walk
            reachable = nx.single_source_dijkstra_path_length(G_proj, center_node, cutoff=RADIUS, weight='length')
            node_pts = [Point(data['x'], data['y']) for n, data in G_proj.nodes(data=True) if n in reachable]
            
            # FIX: Use union_all() instead of unary_union
            net_poly = gpd.GeoSeries(node_pts).union_all().convex_hull
            re_ratio = net_poly.area / (math.pi * RADIUS**2)
            
            # B. Sonic Logic (Sampling Road and Rail separately)
            road_db = get_noise_at_point(lat, lon, road_src)
            rail_db = get_noise_at_point(lat, lon, rail_src)
            
            if road_db == 0 and rail_db == 0:
                total_db = 40 # Minimum noise level for quiet areas
            else:
                # Logarithmic Sum: L_total = 10 * log10(10^(L1/10) + 10^(L2/10))
                l_sum = 10**(road_db/10) + 10**(rail_db/10)
                total_db = 10 * math.log10(max(l_sum, 1))            
            results.append({
                'site': name,
                're_ratio': round(re_ratio, 4),
                'road_db': round(road_db, 1),
                'rail_db': round(rail_db, 1),
                'total_db': round(total_db, 1)
            })
            polygons.append({'geometry': net_poly, 'site': name, 're_ratio': re_ratio})
            
        except Exception as e:
            print(f"❌ Error at {name}: {e}")

# --- 4. EXPORT ---
if results:
    df = pd.DataFrame(results)
    df.to_csv("outputs/audit_final_results.csv", index=False)
    gdf = gpd.GeoDataFrame(polygons, crs=G_proj.graph['crs'])
    gdf.to_file("outputs/shattered_circles_comparison.gpkg", driver="GPKG")
    print("\n✅ Audit Complete!")
    print(df[['site', 're_ratio', 'total_db']])