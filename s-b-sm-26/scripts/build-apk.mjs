/**
 * Run Gradle assembleDebug (or assembleRelease if a keystore exists)
 * and copy the APK to apk-out/ for GitHub Releases upload.
 * Never copy into public/ — Vite would pack the APK into the next native build.
 */
import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const androidDir = path.join(root, "android");

function run(cmd, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd, stdio: "inherit", shell: true, windowsHide: true });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} ${args.join(" ")} exited ${code}`));
    });
  });
}

function findApk() {
  const candidates = [
    path.join(androidDir, "app", "build", "outputs", "apk", "release", "app-release.apk"),
    path.join(androidDir, "app", "build", "outputs", "apk", "debug", "app-debug.apk"),
  ];
  return candidates.find((p) => fs.existsSync(p));
}

async function main() {
  if (!fs.existsSync(androidDir)) {
    throw new Error("android/ missing — run npx cap add android");
  }
  const gradlew = process.platform === "win32" ? "gradlew.bat" : "./gradlew";
  const hasKeystore =
    fs.existsSync(path.join(androidDir, "keystore.properties")) ||
    Boolean(process.env.ANDROID_KEYSTORE_PATH);
  const task = hasKeystore ? "assembleRelease" : "assembleDebug";
  await run(gradlew, [task], androidDir);
  const apk = findApk();
  if (!apk) throw new Error("APK not found after Gradle build");
  const outDir = path.join(root, "apk-out");
  fs.mkdirSync(outDir, { recursive: true });
  const outApk = path.join(outDir, "s-b-sm-26.apk");
  fs.copyFileSync(apk, outApk);
  const mb = (fs.statSync(outApk).size / (1024 * 1024)).toFixed(1);
  console.log(`Copied ${apk} → ${outApk} (${mb} MB)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
