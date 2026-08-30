import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { TRIPS } from "./catalog.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

for (const trip of TRIPS) {
  const from = path.join(root, trip.slug, "dist");
  const to = path.join(dist, trip.slug);
  if (!fs.existsSync(path.join(from, "index.html"))) {
    throw new Error(`Missing build output: ${from}/index.html — run npm run build -w ${trip.slug}`);
  }
  fs.cpSync(from, to, { recursive: true });
  console.log(`assembled /${trip.slug}`);
}

const cards = TRIPS.map(
  (t) => `<a class="card" href="/${t.slug}/">
  <p class="kicker">${t.private ? "Privátní cesta · heslo" : "Veřejná cesta"}</p>
  <h2>${escapeHtml(t.title)}</h2>
  <p class="meta">${escapeHtml(t.highlights)}</p>
</a>`
).join("\n");

fs.writeFileSync(
  path.join(dist, "index.html"),
  `<!doctype html>
<html lang="cs">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Výpravy · ironknot.cz</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;800&display=swap" rel="stylesheet" />
  <style>
    :root { color-scheme: light; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Inter, system-ui, sans-serif; background: #f4f7fa; color: #1b2431; }
    main { max-width: 880px; margin: 0 auto; padding: 48px 20px 72px; }
    .kicker-page { color: #0f766e; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; font-size: 13px; }
    h1 { margin: 8px 0 8px; font-size: 32px; }
    .lead { color: #5b6775; margin: 0 0 28px; }
    .grid { display: grid; gap: 16px; }
    .card { display: block; background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px 22px; text-decoration: none; color: inherit; box-shadow: 0 1px 2px rgba(0,0,0,.04); }
    .card:hover { border-color: #0f766e; }
    .card .kicker { margin: 0 0 6px; font-size: 12px; color: #0f766e; font-weight: 600; }
    .card h2 { margin: 0 0 6px; font-size: 22px; }
    .card .meta { margin: 0; color: #5b6775; font-size: 14px; }
  </style>
</head>
<body>
  <main>
    <p class="kicker-page">vypravy.ironknot.cz</p>
    <h1>Výpravy</h1>
    <p class="lead">Každá cesta má vlastní aplikaci na adrese za lomítkem.</p>
    <div class="grid">
      ${cards}
    </div>
  </main>
</body>
</html>
`
);

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

console.log("wrote dist/index.html");
