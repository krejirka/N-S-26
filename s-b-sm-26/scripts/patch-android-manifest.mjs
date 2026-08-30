import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = path.join(root, "android", "app", "src", "main", "AndroidManifest.xml");

const permissions = `
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-feature android:name="android.hardware.location.gps" android:required="false" />
`;

function main() {
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Missing ${manifestPath}`);
  }
  let xml = fs.readFileSync(manifestPath, "utf8");
  if (xml.includes("ACCESS_FINE_LOCATION")) {
    console.log("AndroidManifest already has location permission");
    return;
  }
  xml = xml.replace(/<manifest\b[^>]*>/, (open) => `${open}\n${permissions}`);
  fs.writeFileSync(manifestPath, xml);
  console.log("Patched AndroidManifest.xml with location permissions");
}

main();
