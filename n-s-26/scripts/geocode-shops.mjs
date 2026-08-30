/** Geocode curated shops with ASCII-safe Nominatim queries → src/data/shops.json */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** @type {{ kind: 'ikea'|'dollarstore', name: string, address: string, country: string, query: string }[]} */
const ENTRIES = [
  // IKEA — visited countries, near corridor / major cities
  { kind: "ikea", name: "IKEA Praha – Černý Most", address: "Chlumecká 664/10, 198 00 Praha", country: "Česko", query: "IKEA Praha Cerny Most" },
  { kind: "ikea", name: "IKEA Brno", address: "Skandinávská 4a, 619 00 Brno", country: "Česko", query: "IKEA Brno Czechia" },
  { kind: "ikea", name: "IKEA Ostrava", address: "Rudná 3115/111, 700 30 Ostrava", country: "Česko", query: "IKEA Ostrava Czechia" },
  { kind: "ikea", name: "IKEA Berlin-Lichtenberg", address: "Landsberger Allee 364, 10365 Berlin", country: "Německo", query: "IKEA Berlin Lichtenberg" },
  { kind: "ikea", name: "IKEA Hamburg-Moorfleet", address: "Unterer Landweg 77, 22113 Hamburg", country: "Německo", query: "IKEA Hamburg Moorfleet" },
  { kind: "ikea", name: "IKEA Slependen", address: "Nesøyveien, 1396 Billingstad", country: "Norsko", query: "IKEA Slependen Norway" },
  { kind: "ikea", name: "IKEA Furuset", address: "Strømsveien 303, 1081 Oslo", country: "Norsko", query: "IKEA Furuset Oslo" },
  { kind: "ikea", name: "IKEA Ringsaker", address: "Kortgaardvegen 2, 2390 Moelv", country: "Norsko", query: "IKEA Ringsaker Norway" },
  { kind: "ikea", name: "IKEA Åsane", address: "Åsane, Bergen", country: "Norsko", query: "IKEA Asane Bergen" },
  { kind: "ikea", name: "IKEA Forus", address: "Forus, Stavanger", country: "Norsko", query: "IKEA Forus Stavanger" },
  { kind: "ikea", name: "IKEA Sørlandet", address: "Kristiansand", country: "Norsko", query: "IKEA Sorlandet Kristiansand" },
  { kind: "ikea", name: "IKEA Leangen", address: "Landbruksvegen 2, 7048 Trondheim", country: "Norsko", query: "IKEA Leangen Trondheim" },
  { kind: "ikea", name: "IKEA Malmö", address: "Kulthusgatan 1, 215 86 Malmö", country: "Švédsko", query: "IKEA Malmo Sweden" },
  { kind: "ikea", name: "IKEA Helsingborg", address: "Väla Centrum, 260 36 Ödåkra", country: "Švédsko", query: "IKEA Helsingborg Vala" },
  { kind: "ikea", name: "IKEA Göteborg Bäckebol", address: "Transportgatan 23, 422 46 Hisings Backa", country: "Švédsko", query: "IKEA Backebol Gothenburg" },
  { kind: "ikea", name: "IKEA Göteborg Kållered", address: "Ekenleden 2, 428 36 Kållered", country: "Švédsko", query: "IKEA Kallered Gothenburg" },
  { kind: "ikea", name: "IKEA Jönköping", address: "A6 Center, Jönköping", country: "Švédsko", query: "IKEA Jonkoping Sweden" },
  { kind: "ikea", name: "IKEA Linköping", address: "Linköping", country: "Švédsko", query: "IKEA Linkoping Sweden" },
  { kind: "ikea", name: "IKEA Kalmar", address: "Bilbyggarvägen 6, Kalmar", country: "Švédsko", query: "IKEA Kalmar Sweden" },
  { kind: "ikea", name: "IKEA Västerås", address: "Stormaktsvägen, Västerås", country: "Švédsko", query: "IKEA Vasteras Sweden" },
  { kind: "ikea", name: "IKEA Uppsala", address: "Rapsgatan, Uppsala", country: "Švédsko", query: "IKEA Uppsala Sweden" },
  { kind: "ikea", name: "IKEA Gävle (Valbo)", address: "Valbovägen 307, 818 32 Valbo", country: "Švédsko", query: "IKEA Valbo Gavle" },
  { kind: "ikea", name: "IKEA Sundsvall", address: "Gesällvägen 3, Sundsvall", country: "Švédsko", query: "IKEA Sundsvall Sweden" },
  { kind: "ikea", name: "IKEA Umeå", address: "Strömpilsplatsen, Umeå", country: "Švédsko", query: "IKEA Umea Sweden" },
  { kind: "ikea", name: "IKEA Haparanda", address: "Norrskensvägen 2, Haparanda", country: "Švédsko", query: "IKEA Haparanda Sweden" },
  { kind: "ikea", name: "IKEA Karlstad", address: "Bergviksvägen, Karlstad", country: "Švédsko", query: "IKEA Karlstad Sweden" },
  { kind: "ikea", name: "IKEA Örebro", address: "Kundvägen 2, Örebro", country: "Švédsko", query: "IKEA Orebro Sweden" },
  { kind: "ikea", name: "IKEA Kungens Kurva", address: "Modulvägen 1, Skärholmen", country: "Švédsko", query: "IKEA Kungens Kurva Stockholm" },
  { kind: "ikea", name: "IKEA Barkarby", address: "Folkungavägen 50, Järfälla", country: "Švédsko", query: "IKEA Barkarby Stockholm" },
  // Dollarstore — along route / trip destinations (more can be added later)
  { kind: "dollarstore", name: "Dollarstore Arvidsjaur", address: "Järnvägsgatan 131, 933 34 Arvidsjaur", country: "Švédsko", query: "Dollarstore Arvidsjaur" },
  { kind: "dollarstore", name: "Dollarstore Gävle", address: "Ingenjörsgatan 16, Gävle", country: "Švédsko", query: "Dollarstore Ingenjorsgatan Gavle" },
  { kind: "dollarstore", name: "Dollarstore Vimmerby", address: "Bolagsgatan 3, 598 40 Vimmerby", country: "Švédsko", query: "Dollarstore Vimmerby" },
  { kind: "dollarstore", name: "Dollarstore Trelleborg", address: "Trelleborg", country: "Švédsko", query: "Dollarstore Trelleborg" },
  { kind: "dollarstore", name: "Dollarstore Malmö Toftanäs", address: "Toftanäs, Malmö", country: "Švédsko", query: "Dollarstore Toftanas Malmo" },
  { kind: "dollarstore", name: "Dollarstore Helsingborg", address: "Helsingborg", country: "Švédsko", query: "Dollarstore Helsingborg" },
  { kind: "dollarstore", name: "Dollarstore Uppsala Gränby", address: "Gränby, Uppsala", country: "Švédsko", query: "Dollarstore Granby Uppsala" },
  { kind: "dollarstore", name: "Dollarstore Umeå Strömpilen", address: "Strömpilen, Umeå", country: "Švédsko", query: "Dollarstore Strompilen Umea" },
  { kind: "dollarstore", name: "Dollarstore Luleå", address: "Luleå", country: "Švédsko", query: "Dollarstore Lulea" },
  { kind: "dollarstore", name: "Dollarstore Boden", address: "Boden", country: "Švédsko", query: "Dollarstore Boden" },
  { kind: "dollarstore", name: "Dollarstore Skellefteå", address: "Skellefteå", country: "Švédsko", query: "Dollarstore Skelleftea" },
  { kind: "dollarstore", name: "Dollarstore Sundsvall", address: "Sundsvall", country: "Švédsko", query: "Dollarstore Sundsvall" },
  { kind: "dollarstore", name: "Dollarstore Hudiksvall", address: "Hudiksvall", country: "Švédsko", query: "Dollarstore Hudiksvall" },
  { kind: "dollarstore", name: "Dollarstore Söderhamn", address: "Söderhamn", country: "Švédsko", query: "Dollarstore Soderhamn" },
  { kind: "dollarstore", name: "Dollarstore Sandviken", address: "Sandviken", country: "Švédsko", query: "Dollarstore Sandviken" },
  { kind: "dollarstore", name: "Dollarstore Linköping Tornby", address: "Tornby, Linköping", country: "Švédsko", query: "Dollarstore Tornby Linkoping" },
  { kind: "dollarstore", name: "Dollarstore Norrköping", address: "Norrköping", country: "Švédsko", query: "Dollarstore Norrkoping" },
  { kind: "dollarstore", name: "Dollarstore Kalmar", address: "Kalmar", country: "Švédsko", query: "Dollarstore Kalmar" },
  { kind: "dollarstore", name: "Dollarstore Växjö", address: "Växjö", country: "Švédsko", query: "Dollarstore Vaxjo" },
  { kind: "dollarstore", name: "Dollarstore Jönköping", address: "Jönköping", country: "Švédsko", query: "Dollarstore Jonkoping" },
  { kind: "dollarstore", name: "Dollarstore Örnsköldsvik", address: "Örnsköldsvik", country: "Švédsko", query: "Dollarstore Ornskoldsvik" },
];

async function geocode(query) {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "n-s-26-trip-planner/1.0 (personal travel map)" },
  });
  if (!res.ok) throw new Error(String(res.status));
  const data = await res.json();
  if (!data[0]) return null;
  return {
    lat: Math.round(Number(data[0].lat) * 1e5) / 1e5,
    lng: Math.round(Number(data[0].lon) * 1e5) / 1e5,
  };
}

const shops = [];
let i = 0;
for (const e of ENTRIES) {
  i += 1;
  process.stdout.write(`[${i}/${ENTRIES.length}] ${e.name}... `);
  const g = await geocode(e.query);
  await sleep(1100);
  if (!g) {
    console.log("MISS");
    continue;
  }
  console.log(`${g.lat}, ${g.lng}`);
  shops.push({
    id: `${e.kind}-${shops.filter((s) => s.kind === e.kind).length + 1}`,
    kind: e.kind,
    name: e.name,
    address: e.address,
    country: e.country,
    lat: g.lat,
    lng: g.lng,
  });
}

const out = {
  note: "IKEA a Dollarstore v navštívených zemích. Další adresy lze doplnit sem; regenerace: node scripts/geocode-shops.mjs",
  generatedAt: new Date().toISOString(),
  shops,
};

const outPath = path.join(__dirname, "..", "src", "data", "shops.json");
fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + "\n");
console.log(`Wrote ${shops.length} shops → ${outPath}`);
