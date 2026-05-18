"""Route optimization via OSRM (public, free) + Nominatim geocoding with cache."""
import asyncio
import logging
import httpx
from datetime import datetime, timezone

from .db import db

logger = logging.getLogger(__name__)

NOMINATIM = "https://nominatim.openstreetmap.org/search"
OSRM = "https://router.project-osrm.org"
UA = "Transporter-Pro/1.0 (logistics-saas)"


async def _geocode(address: str) -> tuple[float, float] | None:
    """Return (lng, lat) for an address. Cached in db.geocode_cache."""
    if not address or len(address.strip()) < 4:
        return None
    cached = await db.geocode_cache.find_one({"address": address})
    if cached and cached.get("lng") is not None:
        return (cached["lng"], cached["lat"])
    try:
        async with httpx.AsyncClient(timeout=10.0, headers={"User-Agent": UA}) as c:
            r = await c.get(NOMINATIM, params={"q": address, "format": "json", "limit": 1})
            if r.status_code == 200 and r.json():
                hit = r.json()[0]
                lng, lat = float(hit["lon"]), float(hit["lat"])
                await db.geocode_cache.update_one(
                    {"address": address},
                    {"$set": {"address": address, "lng": lng, "lat": lat, "cached_at": datetime.now(timezone.utc)}},
                    upsert=True,
                )
                return (lng, lat)
    except Exception as e:
        logger.warning(f"Geocode failed for '{address}': {e}")
    return None


async def optimize_route(deliveries: list[dict]) -> dict:
    """
    Geocode addresses, call OSRM /trip for optimal order, OSRM /route for original distance.
    Returns: {sequence: [{tracking_id, order}], distance_original_km, distance_optimized_km, saved_km}
    """
    # Geocode each address (sequential to respect Nominatim rate limit)
    points = []  # list of (delivery, (lng, lat))
    for d in deliveries:
        coord = await _geocode(d.get("recipient_address", ""))
        if coord:
            points.append((d, coord))
        await asyncio.sleep(1.05)  # Nominatim ToS: 1 req/sec

    if len(points) < 2:
        return {"sequence": [], "distance_original_km": 0, "distance_optimized_km": 0, "saved_km": 0, "skipped": len(deliveries) - len(points)}

    coords_str = ";".join(f"{lng},{lat}" for _, (lng, lat) in points)

    async with httpx.AsyncClient(timeout=20.0) as c:
        # OSRM /trip — solves TSP, returns optimal order via waypoints[].waypoint_index
        trip_url = f"{OSRM}/trip/v1/driving/{coords_str}?source=first&roundtrip=false"
        trip_resp = await c.get(trip_url)
        trip_data = trip_resp.json() if trip_resp.status_code == 200 else {}

        # OSRM /route — original given order, full route distance
        route_url = f"{OSRM}/route/v1/driving/{coords_str}?overview=false"
        route_resp = await c.get(route_url)
        route_data = route_resp.json() if route_resp.status_code == 200 else {}

    if trip_data.get("code") != "Ok":
        return {"sequence": [], "distance_original_km": 0, "distance_optimized_km": 0, "saved_km": 0, "error": trip_data.get("code", "OSRM error")}

    # waypoints[i].waypoint_index = optimal visit order for input i
    waypoints = trip_data.get("waypoints", [])
    distance_optimized = sum(t.get("distance", 0) for t in trip_data.get("trips", []))
    distance_original = sum(r.get("distance", 0) for r in route_data.get("routes", [])) if route_data.get("code") == "Ok" else distance_optimized

    sequence = []
    for input_idx, wp in enumerate(waypoints):
        order = wp.get("waypoint_index")
        if order is not None and input_idx < len(points):
            sequence.append({
                "tracking_id": points[input_idx][0]["tracking_id"],
                "order": int(order),
            })

    return {
        "sequence": sequence,
        "distance_original_km": round(distance_original / 1000.0, 2),
        "distance_optimized_km": round(distance_optimized / 1000.0, 2),
        "saved_km": round(max(0, (distance_original - distance_optimized)) / 1000.0, 2),
        "skipped": len(deliveries) - len(points),
    }
