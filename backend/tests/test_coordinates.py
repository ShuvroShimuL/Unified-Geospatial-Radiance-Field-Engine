"""
Test ECEF roundtrip accuracy.
These tests do not require a database connection.
"""
import math

def wgs84_to_ecef(lat_deg, lon_deg, alt=0):
    a = 6378137.0
    e2 = 0.00669437999014
    lat = math.radians(lat_deg)
    lon = math.radians(lon_deg)
    N = a / math.sqrt(1 - e2 * math.sin(lat)**2)
    x = (N + alt) * math.cos(lat) * math.cos(lon)
    y = (N + alt) * math.cos(lat) * math.sin(lon)
    z = (N * (1 - e2) + alt) * math.sin(lat)
    return x, y, z

def ecef_to_wgs84(x, y, z):
    a  = 6378137.0
    e2 = 0.00669437999014
    lon = math.atan2(y, x)
    p   = math.sqrt(x**2 + y**2)
    lat = math.atan2(z, p * (1 - e2))
    for _ in range(10):
        N   = a / math.sqrt(1 - e2 * math.sin(lat)**2)
        lat = math.atan2(z + e2 * N * math.sin(lat), p)
    alt = p / math.cos(lat) - a / math.sqrt(1 - e2 * math.sin(lat)**2)
    return math.degrees(lat), math.degrees(lon), alt

def test_ecef_roundtrip_dhaka():
    """ECEF roundtrip for Dhaka must be stable to < 1mm."""
    lat, lon = 23.8103, 90.4125
    x, y, z  = wgs84_to_ecef(lat, lon)
    lat2, lon2, _ = ecef_to_wgs84(x, y, z)
    assert abs(lat - lat2) < 1e-8, f"Lat drift: {abs(lat-lat2)}"
    assert abs(lon - lon2) < 1e-8, f"Lon drift: {abs(lon-lon2)}"

def test_ecef_roundtrip_global():
    """Multiple locations must roundtrip cleanly."""
    coords = [(0,0), (51.5, -0.1), (-33.9, 151.2), (35.7, 139.7)]
    for lat, lon in coords:
        x, y, z = wgs84_to_ecef(lat, lon)
        lat2, lon2, _ = ecef_to_wgs84(x, y, z)
        assert abs(lat - lat2) < 1e-8
        assert abs(lon - lon2) < 1e-8
