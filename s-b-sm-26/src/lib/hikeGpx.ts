import type { HikingRoute } from "@/types/trip";

function xmlEscape(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function hikeToGpx(hike: HikingRoute): string {
  const wpts = hike.pois
    .map((p) => {
      const ele = p.ele != null && Number.isFinite(p.ele) ? `\n    <ele>${p.ele}</ele>` : "";
      return `  <wpt lat="${p.lat}" lon="${p.lng}">
    <name>${xmlEscape(p.name)}</name>${ele}
    <type>${xmlEscape(p.kind)}</type>
  </wpt>`;
    })
    .join("\n");
  const pts = hike.track
    .map(([lng, lat]) => `      <trkpt lat="${lat}" lon="${lng}"></trkpt>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="vypravy.ironknot.cz" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${xmlEscape(hike.name)}</name>
    <desc>${xmlEscape(hike.note || hike.source)}</desc>
  </metadata>
${wpts}
  <trk>
    <name>${xmlEscape(hike.name)}</name>
    <trkseg>
${pts}
    </trkseg>
  </trk>
</gpx>
`;
}

export function downloadHikeGpx(hike: HikingRoute) {
  const blob = new Blob([hikeToGpx(hike)], { type: "application/gpx+xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${hike.id}.gpx`;
  a.click();
  URL.revokeObjectURL(url);
}