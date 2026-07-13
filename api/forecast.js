const MET_USER_AGENT = "n-s-26.ironknot.cz/1.0 github.com/krejirka/N-S-26";

export default async function handler(req, res) {
  const { lat, lon } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({ error: "lat and lon required" });
  }

  const metUrl = `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`;
  const response = await fetch(metUrl, {
    headers: { "User-Agent": MET_USER_AGENT },
  });

  if (!response.ok) {
    const text = await response.text();
    return res.status(response.status).send(text);
  }

  const data = await response.json();
  res.setHeader("Cache-Control", "public, s-maxage=600, stale-while-revalidate=300");
  return res.status(200).json(data);
}
