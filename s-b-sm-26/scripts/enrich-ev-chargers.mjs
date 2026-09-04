/**
 * Enrich ev-chargers.json:
 *  - Tesla Superchargers: stallCount / power / locationId from supercharge.info
 *  - fee / stallsTotal from OSM tags already present when re-fetched; here we
 *    backfill feeLabel and stalls from sockets / SC data for existing JSON.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outPath = path.join(root, "src", "data", "ev-chargers.json");
const SC_URL = "https://supercharge.info/service/supercharge/allSites";

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function osmNumericId(id) {
  const m = String(id).match(/^ev-[nw]?(\d+)$/i);
  return m ? m[1] : null;
}

function stallsFromSockets(sockets) {
  if (!sockets) return null;
  const nums = [...String(sockets).matchAll(/×\s*(\d+)/g)].map((m) => Number(m[1]));
  if (!nums.length) return null;
  return nums.reduce((a, b) => a + b, 0);
}

function feeFromRaw(fee) {
  if (fee == null || fee === "") return { fee: "unknown", feeLabel: "cena v OSM neuvedena" };
  const s = String(fee).toLowerCase().trim();
  if (s === "no" || s === "free" || s === "0") return { fee: "no", feeLabel: "zdarma" };
  if (s === "yes" || s === "paid") return { fee: "yes", feeLabel: "placené" };
  if (s.includes("donation")) return { fee: "yes", feeLabel: "dobrovolné / placené" };
  return { fee: "unknown", feeLabel: `cena: ${fee}` };
}

function websiteLocationId(website) {
  if (!website) return null;
  const m = String(website).match(/supercharger\/([^/?#]+)/i);
  return m ? decodeURIComponent(m[1]) : null;
}

const data = JSON.parse(fs.readFileSync(outPath, "utf8"));
const chargers = data.chargers || [];

console.log(`Loading supercharge.info …`);
const scRes = await fetch(SC_URL, {
  headers: { "User-Agent": "vypravy.ironknot.cz/1.0", Accept: "application/json" },
});
if (!scRes.ok) throw new Error(`supercharge.info ${scRes.status}`);
const sites = await scRes.json();
console.log(`SC sites: ${sites.length}`);

const byOsm = new Map();
const byLoc = new Map();
for (const s of sites) {
  if (s.osmId != null) byOsm.set(String(s.osmId), s);
  if (s.locationId) byLoc.set(String(s.locationId).toLowerCase(), s);
}

let teslaMatched = 0;
const enriched = chargers.map((c) => {
  const osmId = osmNumericId(c.id);
  const locFromWeb = websiteLocationId(c.website);
  let sc = null;
  if (c.tesla) {
    if (osmId && byOsm.has(osmId)) sc = byOsm.get(osmId);
    else if (locFromWeb && byLoc.has(locFromWeb.toLowerCase())) sc = byLoc.get(locFromWeb.toLowerCase());
    else {
      let best = null;
      let bestD = 0.35;
      for (const s of sites) {
        const g = s.gps;
        if (!g) continue;
        const d = haversineKm(c.lat, c.lng, g.latitude, g.longitude);
        if (d < bestD) {
          bestD = d;
          best = s;
        }
      }
      sc = best;
    }
    if (sc) teslaMatched += 1;
  }

  const feeInfo =
    c.fee && c.feeLabel
      ? { fee: c.fee, feeLabel: c.feeLabel }
      : feeFromRaw(c.feeRaw ?? null);

  // Tesla Superchargers are paid network (not free public AC)
  const fee =
    c.tesla && feeInfo.fee === "unknown"
      ? { fee: "yes", feeLabel: "placené (Tesla)" }
      : feeInfo;

  const stallsTotal =
    (sc && sc.stallCount > 0 ? sc.stallCount : null) ||
    c.stallsTotal ||
    stallsFromSockets(c.sockets) ||
    null;

  const maxKw =
    (sc && sc.powerKilowatt > 0 ? sc.powerKilowatt : null) || c.maxKw || null;
  const powerLabel =
    maxKw != null && maxKw >= 1
      ? `${Math.round(maxKw)} kW`
      : c.powerLabel || (c.tesla ? "Tesla Supercharger" : "výkon neuveden");

  const next = {
    ...c,
    tesla: Boolean(c.tesla || sc),
    maxKw,
    powerLabel,
    stallsTotal,
    fee: fee.fee,
    feeLabel: fee.feeLabel,
    teslaLocationId: sc?.locationId || locFromWeb || c.teslaLocationId || null,
    teslaOtherEvs: sc ? Boolean(sc.otherEVs) : c.teslaOtherEvs ?? null,
    osmId: osmId || c.osmId || null,
  };
  delete next.feeRaw;
  return next;
});

enriched.sort((a, b) => {
  if (Boolean(a.tesla) !== Boolean(b.tesla)) return a.tesla ? -1 : 1;
  return (b.maxKw || 0) - (a.maxKw || 0) || a.name.localeCompare(b.name, "cs");
});

const teslaCount = enriched.filter((c) => c.tesla).length;
fs.writeFileSync(
  outPath,
  JSON.stringify(
    {
      note: "Tesla Superchargery + DC ≥50 kW ≤25 km od trasy. Živá volná kapacita online přes /api/ev-availability (TomTom).",
      generatedAt: new Date().toISOString(),
      teslaCount,
      chargerCount: enriched.length,
      chargers: enriched,
    },
    null,
    2
  ) + "\n"
);
console.log(`Wrote ${enriched.length} chargers (Tesla ${teslaCount}, matched SC ${teslaMatched}) → ${outPath}`);
