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

fs.writeFileSync(
  path.join(dist, "index.html"),
  `<!doctype html>
<html lang="cs">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="robots" content="noindex" />
  <title></title>
  <style>html,body{margin:0;background:#fff;min-height:100%;}</style>
</head>
<body></body>
</html>
`
);

console.log("wrote empty dist/index.html");
