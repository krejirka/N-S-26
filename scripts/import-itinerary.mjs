import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "node:child_process";
import { commonsImage, COMMONS_FILES, resolvePlacesImages } from "./commons-image.mjs";
import { applyDayContent } from "./day-content.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const xlsxPath = path.join(root, "moje", "Norsko-Svedsko 26.xlsx");
const outDir = path.join(root, "src", "data");

const PLACE_ENRICHMENT = {
  "Hradec Králové": {
    placeId: "hradec_kralove",
    places: [
      {
        name: "Hradec Králové",
        links: [
          { label: "Wikipedia", url: "https://cs.wikipedia.org/wiki/Hradec_Kr%C3%A1lov%C3%A9" },
          { label: "Turistická informace", url: "https://www.hradeckralove.org/" },
        ],
        image: commonsImage(COMMONS_FILES.hradec, "Pohled na Hradec Králové"),
      },
    ],
  },
  Oslo: {
    placeId: "oslo",
    places: [
      {
        name: "Oslo",
        links: [
          { label: "Wikipedia", url: "https://cs.wikipedia.org/wiki/Oslo" },
          { label: "Visit Oslo", url: "https://www.visitoslo.com/" },
        ],
        image: commonsImage(COMMONS_FILES.oslo, "Oslo"),
      },
    ],
  },
  Lillehammer: {
    placeId: "lillehammer",
    places: [
      {
        name: "Lillehammer",
        links: [
          { label: "Wikipedia", url: "https://cs.wikipedia.org/wiki/Lillehammer" },
          { label: "Visit Norway", url: "https://www.visitnorway.com/places-to-go/eastern-norway/lillehammer/" },
        ],
        image: commonsImage(COMMONS_FILES.lillehammer, "Lillehammer"),
      },
    ],
  },
  "NP Rondane": {
    placeId: "rondane",
    places: [
      {
        name: "Národní park Rondane",
        links: [
          { label: "Wikipedia", url: "https://cs.wikipedia.org/wiki/Rondane" },
          { label: "Národní park", url: "https://www.nationalpark.no/parkene/rondane" },
        ],
        image: commonsImage(COMMONS_FILES.rondane, "NP Rondane"),
      },
      { name: "Rondvassbu", links: [{ label: "DNT Rondvassbu", url: "https://www.dnt.no/turhytta/rondvassbu" }] },
    ],
  },
  Sundalsora: {
    placeId: "sundalsora",
    places: [
      {
        name: "Viewpoint Snøhetta (Dovrefjell)",
        links: [
          { label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Sn%C3%B8hetta_(mountain)" },
          { label: "Visit Norway", url: "https://www.visitnorway.com/places-to-go/fjord-norway/the-northwest/the-snohetta-viewpoint/" },
        ],
        image: commonsImage(COMMONS_FILES.snohetta, "Viewpoint Snøhetta"),
      },
    ],
  },
  Trondheim: {
    placeId: "trondheim",
    places: [
      {
        name: "Innerdalen",
        links: [{ label: "Visit Norway", url: "https://www.visitnorway.com/places-to-go/fjord-norway/the-northwest/innerdalen/" }],
        image: commonsImage(COMMONS_FILES.innerdalen, "Innerdalen"),
      },
      {
        name: "Trondheim",
        links: [
          { label: "Wikipedia", url: "https://cs.wikipedia.org/wiki/Trondheim" },
          { label: "Visit Trondheim", url: "https://www.visittrondheim.no/" },
        ],
        image: commonsImage(COMMONS_FILES.trondheim, "Trondheim"),
      },
    ],
  },
  Laksforsen: {
    placeId: "laksforsen",
    places: [
      {
        name: "Laksforsen",
        links: [
          { label: "Wikipedia", url: "https://no.wikipedia.org/wiki/Laksforsen" },
          { label: "Visit Norway", url: "https://www.visitnorway.com/listings/laksforsen-waterfall/177671/" },
        ],
        image: commonsImage(COMMONS_FILES.laksforsen, "Vodopád Laksforsen"),
      },
    ],
  },
  "Furøy": {
    placeId: "furoy",
    places: [
      {
        name: "Ledovec Svartisen",
        links: [
          { label: "Wikipedia", url: "https://cs.wikipedia.org/wiki/Svartisen" },
          { label: "Visit Norway", url: "https://www.visitnorway.com/places-to-go/northern-norway/svartisen/" },
        ],
        image: commonsImage(COMMONS_FILES.svartisen, "Ledovec Svartisen"),
      },
    ],
  },
  "250": {
    placeId: "junkerdal",
    places: [
      { name: "Kjemåfossen", links: [{ label: "Visit Norway", url: "https://www.visitnorway.com/places-to-go/northern-norway/saltdal/" }] },
      {
        name: "Junkerdal",
        links: [{ label: "Wikipedia", url: "https://no.wikipedia.org/wiki/Junkerdal" }],
        image: commonsImage(COMMONS_FILES.junkerdal, "Junkerdal"),
      },
    ],
  },
  Myrkulla: {
    placeId: "myrkulla",
    places: [
      {
        name: "Myrkulla (Arvidsjaur)",
        links: [
          { label: "Myrkulla", url: "https://www.myrkulla.com/" },
          { label: "Arvidsjaur – Wikipedia", url: "https://cs.wikipedia.org/wiki/Arvidsjaur" },
          { label: "Visit Sweden", url: "https://visitsweden.com/where-to-go/middle/northern-sweden/arvidsjaur/" },
        ],
      },
    ],
  },
  Axmarbruk: {
    placeId: "axmarbruk",
    places: [
      {
        name: "Skuleskogen",
        links: [
          { label: "Wikipedia", url: "https://cs.wikipedia.org/wiki/Skuleskogen" },
          { label: "Národní park", url: "https://www.nationalpark.se/skuleskogen/" },
        ],
        image: commonsImage(COMMONS_FILES.skuleskogen, "Slåttdalsskrevan ve Skuleskogen"),
      },
    ],
  },
  Vimmerby: {
    placeId: "vimmerby",
    places: [
      {
        name: "Astrid Lindgrens Värld",
        links: [
          { label: "Oficiální web", url: "https://www.alv.se/" },
          { label: "Wikipedia", url: "https://cs.wikipedia.org/wiki/Astrid_Lindgren" },
        ],
      },
    ],
  },
  "Trelleborg-Rostock (DE)": {
    placeId: "ales_stenar",
    places: [
      {
        name: "Ales Stenar",
        links: [
          { label: "Wikipedia", url: "https://cs.wikipedia.org/wiki/Ales_stenar" },
          { label: "Visit Sweden", url: "https://visitskane.com/classic-attractions/ales-stones/" },
        ],
        image: commonsImage(COMMONS_FILES.ales, "Ales Stenar"),
      },
    ],
  },
};

function excelSerialToDate(serial) {
  const utcDays = Math.floor(Number(serial) - 25569);
  return new Date(utcDays * 86400 * 1000).toISOString().slice(0, 10);
}

function isPrice(val) {
  if (!val) return false;
  const s = String(val);
  return /^\d{3,5}$/.test(s) || /Kč|NOK|€/.test(s);
}

function isGarbageProgram(text) {
  const s = String(text || "").trim();
  return !s || /^\d{3,5}$/.test(s) || isPrice(s);
}

function isUrl(val) {
  return /^https?:\/\//.test(String(val || ""));
}

function sanitizeLodging(cols) {
  const r4 = String(cols[4] || "").trim();
  const r5 = String(cols[5] || "").trim();
  const raw = isUrl(r4) ? r5 : r4;
  if (!raw) return null;
  if (isUrl(raw) || isPrice(raw)) return null;
  if (/^mail$/i.test(raw)) return "ubytování";
  if (/^B$/i.test(raw)) return "ubytování";
  if (/^S$/i.test(raw)) return "stan";
  if (/park4night|airbnb|furoycamp|camping/i.test(raw)) return /stan|^S$/i.test(raw) ? "stan" : "ubytování";
  if (/kajuta|trajekt/i.test(raw)) return "trajekt — kajuta";
  return raw.length > 60 ? "ubytování" : raw;
}

function sanitizeDetail(cols) {
  const parts = [];
  for (const c of cols) {
    const s = String(c || "").trim();
    if (!s || isUrl(s) || isPrice(s)) continue;
    if (/^B$|^S$|^mail$/i.test(s)) continue;
    if (/do \d+\.\d+\./i.test(s)) continue;
    if (/^\d+$/.test(s) && s.length >= 3) continue;
    if (/park4night|p4n|airbnb|furoycamp/i.test(s)) continue;
    parts.push(s);
  }
  return parts.join(" · ");
}

function normalizeDestination(dest) {
  return String(dest || "").trim().replace(/\s+$/, "");
}

function getEnrichment(dest) {
  const key = normalizeDestination(dest);
  return PLACE_ENRICHMENT[key] || { placeId: slugify(key), places: [] };
}

function slugify(s) {
  return (
    String(s)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "") || "stop"
  );
}

function readXlsx(filePath) {
  const pyScript = path.join(__dirname, "_read_xlsx.py");
  fs.writeFileSync(
    pyScript,
    `import zipfile, xml.etree.ElementTree as ET, json, sys
sys.stdout.reconfigure(encoding='utf-8')
with zipfile.ZipFile(sys.argv[1]) as z:
    shared = []
    root = ET.fromstring(z.read('xl/sharedStrings.xml'))
    ns = {'m': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
    for si in root.findall('m:si', ns):
        texts = [t.text or '' for t in si.findall('.//m:t', ns)]
        shared.append(''.join(texts))
    sheet = ET.fromstring(z.read('xl/worksheets/sheet1.xml'))
    rows = []
    for row in sheet.findall('m:sheetData/m:row', ns):
        vals = []
        for c in row.findall('m:c', ns):
            t = c.get('t')
            v = c.find('m:v', ns)
            if v is None: vals.append('')
            elif t == 's': vals.append(shared[int(v.text)])
            else: vals.append(v.text)
        if any(str(x).strip() for x in vals):
            rows.append(vals)
    print(json.dumps(rows, ensure_ascii=False))
`
  );
  const raw = execSync(`python "${pyScript}" "${filePath}"`, { encoding: "utf8" });
  fs.unlinkSync(pyScript);
  return JSON.parse(raw);
}

const rows = readXlsx(xlsxPath);
const dataRows = rows.slice(1).filter((r) => r[0] && !Number.isNaN(Number(r[0])));

async function buildItinerary() {
  const days = [];

  const first = dataRows[0];
  days.push({
    day: 1,
    date: excelSerialToDate(first[0]),
    weekday: first[1],
    destination: "Hradec Králové → Rostock → Trelleborg",
    km: Number(first[3]) || null,
    lodging: "trajekt — kajuta",
    logistics: sanitizeDetail(first.slice(6)) || "Odjezd trajektu 23:45",
    program: "",
    placeId: "trelleborg_ferry",
    phase: "tam",
    segmentIds: ["hk_rostock", "rostock_trelleborg_ferry"],
    places: [
      ...(PLACE_ENRICHMENT["Hradec Králové"]?.places || []).map((p) => structuredClone(p)),
      { name: "Trajekt Rostock – Trelleborg", links: [{ label: "Scandlines", url: "https://www.scandlines.com/" }] },
    ],
  });

  for (let i = 1; i < dataRows.length; i++) {
    const r = dataRows[i];
    const rawDest = normalizeDestination(r[2]) || normalizeDestination(r[6]) || "—";
    const destination = rawDest === "250" ? "Junkerdal" : rawDest;
    const enrich = getEnrichment(r[2]) || getEnrichment(destination);
    const program = String(r[r.length - 1] || "").trim();
    const detail = sanitizeDetail(r.slice(6, program ? -1 : undefined));
    const lodging = sanitizeLodging(r);
    const dayNum = i + 1;
    const isReturn = dayNum >= 15;

    let finalDest = destination;
    let finalPlaceId = enrich.placeId;
    let places = (enrich.places || []).map((p) => structuredClone(p));
    let segmentIds = [];

    if (dayNum === dataRows.length) {
      finalDest = "Rostock → Hradec Králové";
      finalPlaceId = "hradec_kralove";
      places = (PLACE_ENRICHMENT["Hradec Králové"]?.places || []).map((p) => structuredClone(p));
      segmentIds = ["rostock_hk"];
    }

    let finalProgram = isGarbageProgram(program) ? "" : program;
    let finalLogistics = detail;
    if (program && !isGarbageProgram(program) && program.length < 40 && !/[.!]/.test(program) && dayNum <= 3) {
      finalLogistics = [detail, program].filter(Boolean).join(" · ");
      finalProgram = "";
    }

    days.push({
      day: dayNum,
      date: excelSerialToDate(r[0]),
      weekday: r[1],
      destination: finalDest,
      km: Number(r[3]) || null,
      lodging,
      logistics: finalLogistics,
      program: finalProgram,
      placeId: finalPlaceId,
      phase: isReturn ? "zpět" : "tam",
      segmentIds,
      places,
    });
  }

  for (const day of days) {
    applyDayContent(day);
    day.places = await resolvePlacesImages(day.places);
    await new Promise((r) => setTimeout(r, 200));
  }

  const itinerary = {
    meta: {
      title: "Norsko-Švédsko 2026",
      origin: "Hradec Králové",
      destination: "Hradec Králové",
      highlights: ["Oslo", "Trondheim", "Svartisen", "Myrkulla", "Höga Kusten"],
      totalDays: days.length,
      totalKmExcel: 5207,
      note: "Silniční trasy vypočteny z OpenStreetMap přes OSRM.",
    },
    days,
  };

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "itinerary.json"), JSON.stringify(itinerary, null, 2), "utf8");
  console.log(`Wrote ${days.length} days to src/data/itinerary.json`);
}

buildItinerary().catch((e) => {
  console.error(e);
  process.exit(1);
});
