/**
 * Live EV charger availability near a point (TomTom Search + Availability).
 * GET /api/ev-availability?lat=&lng=&radius= (radius meters, default 30000)
 */
import { preflight } from "./_cors.js";
import { fetchEvAvailabilityNear } from "./_evAvailability.js";

export default async function handler(req, res) {
  if (preflight(req, res)) return;
  const key = String(process.env.TOMTOM_API_KEY || "").trim();
  if (!key) {
    return res.status(503).json({
      live: false,
      stations: [],
      error: "TOMTOM_API_KEY not configured",
    });
  }

  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  const radiusM = Math.min(Math.max(Number(req.query.radius) || 30000, 1000), 50000);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return res.status(400).json({ live: false, stations: [], error: "lat and lng required" });
  }

  try {
    const result = await fetchEvAvailabilityNear(key, { lat, lng, radiusM });
    res.setHeader("Cache-Control", "public, s-maxage=90, stale-while-revalidate=60");
    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.status && err.status < 500 ? err.status : 502).json({
      live: false,
      stations: [],
      error: err.message || "TomTom EV availability failed",
      detail: err.detail,
    });
  }
}
