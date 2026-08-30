/**
 * TomTom Incident Details along a day route path.
 * Query: path=lng,lat;lng,lat;... (sampled corridor points)
 */
import { fetchIncidentsAlongPath, parsePathParam } from "./_tomtomIncidents.js";

export default async function handler(req, res) {
  const key = String(process.env.TOMTOM_API_KEY || "").trim();
  if (!key) {
    return res.status(503).json({
      error: "TOMTOM_API_KEY not configured",
      liveIncidents: false,
      incidents: [],
    });
  }

  const path = req.query.path;
  const points = parsePathParam(path);
  if (points.length < 2) {
    return res.status(400).json({
      error: "path required as lng,lat;lng,lat;... (min 2 points)",
      liveIncidents: false,
      incidents: [],
    });
  }

  try {
    const result = await fetchIncidentsAlongPath(key, points, { language: "cs-CZ" });
    res.setHeader("Cache-Control", "public, s-maxage=90, stale-while-revalidate=60");
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({
      error: String(err?.message || err),
      liveIncidents: false,
      incidents: [],
    });
  }
}
