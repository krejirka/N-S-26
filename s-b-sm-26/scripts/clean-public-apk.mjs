import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public", "apk");
if (!fs.existsSync(dir)) process.exit(0);
for (const name of fs.readdirSync(dir)) {
  if (name.endsWith(".apk")) fs.unlinkSync(path.join(dir, name));
}
