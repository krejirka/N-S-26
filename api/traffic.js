/**
 * TomTom routing with traffic. Set TOMTOM_API_KEY in Vercel env.
 * Without key returns 503 so client can fall back to OSRM distance + 110 km/h estimate.
 */
export default async function handler(req, res) {
  const key = process.env.TOMTOM_API_KEY;
  if (!key) {
    return res.status(503).json({
      error: "TOMTOM_API_KEY not configured",
      liveTraffic: false,
    });
  }

  const { from, to } = req.query;
  if (!from || !to) {
    return res.status(400).json({ error: "from and to required as lat,lng" });
  }

  const locations = `${from}:${to}`;
  const url =
    `https://api.tomtom.com/routing/1/calculateRoute/${encodeURIComponent(locations)}/json` +
    `?key=${encodeURIComponent(key)}&traffic=true&travelMode=car&routeType=fastest` +
    `&computeBestOrder=false&sectionType=traffic`;

  const response = await fetch(url);
  if (!response.ok) {
    const text = await response.text();
    return res.status(response.status).send(text);
  }

  const data = await response.json();
  const route = data.routes?.[0];
  const summary = route?.summary;
  if (!summary) {
    return res.status(502).json({ error: "No route from TomTom" });
  }

  const distanceKm = Math.round((summary.lengthInMeters / 1000) * 10) / 10;
  const durationSec = summary.travelTimeInSeconds;
  const durationTrafficSec = summary.trafficDelayInSeconds != null
    ? summary.travelTimeInSeconds
    : summary.travelTimeInSeconds;
  const delaySec = summary.trafficDelayInSeconds || 0;
  const noTrafficSec = durationSec - delaySec;

  const incidents = [];
  for (const leg of route.legs || []) {
    for (const section of leg.sections || []) {
      if (section.sectionType === "TRAFFIC" || section.simpleCategory) {
        incidents.push({
          category: section.simpleCategory || section.sectionType || "traffic",
          delaySec: section.effectiveSpeedInKmh
            ? Math.max(0, Math.round(((section.endPointIndex - section.startPointIndex) || 0) * 2))
            : undefined,
          magnitude: section.magnitudeOfDelay,
        });
      }
    }
  }

  res.setHeader("Cache-Control", "public, s-maxage=120, stale-while-revalidate=60");
  return res.status(200).json({
    liveTraffic: true,
    distanceKm,
    durationSec,
    durationTrafficSec,
    delaySec,
    noTrafficSec,
    incidents,
  });
}
