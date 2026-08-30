import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import fs from "fs";
import {
  fetchIncidentsAlongPath,
  parsePathParam,
} from "./server/tomtomIncidents.mjs";

const MET_USER_AGENT = "vypravy.ironknot.cz/1.0 github.com/krejirka/N-S-26";

/** Local /api/traffic + /api/incidents → TomTom (same as Vercel api/). */
function tomtomTrafficPlugin(apiKey: string | undefined): Plugin {
  const key = apiKey?.trim();
  return {
    name: "tomtom-traffic-api",
    configureServer(server) {
      server.middlewares.use("/api/traffic", async (req, res, next) => {
        if (req.method !== "GET") return next();
        try {
          if (!key) {
            res.statusCode = 503;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ liveTraffic: false, error: "TOMTOM_API_KEY not configured" }));
            return;
          }
          const url = new URL(req.url || "", "http://localhost");
          const from = url.searchParams.get("from");
          const to = url.searchParams.get("to");
          if (!from || !to) {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "from and to required as lat,lng" }));
            return;
          }
          const locations = `${from}:${to}`;
          const tomtomUrl =
            `https://api.tomtom.com/routing/1/calculateRoute/${encodeURIComponent(locations)}/json` +
            `?key=${encodeURIComponent(key)}&traffic=true&travelMode=car&routeType=fastest` +
            `&departAt=now&sectionType=traffic`;
          const response = await fetch(tomtomUrl);
          const text = await response.text();
          if (!response.ok) {
            res.statusCode = response.status;
            res.setHeader("Content-Type", "application/json");
            res.end(
              JSON.stringify({
                liveTraffic: false,
                error: "TomTom request failed",
                status: response.status,
                detail: text.slice(0, 300),
              })
            );
            return;
          }
          const data = JSON.parse(text);
          const summary = data.routes?.[0]?.summary;
          if (!summary) {
            res.statusCode = 502;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "No route from TomTom", liveTraffic: false }));
            return;
          }
          const delaySec = summary.trafficDelayInSeconds || 0;
          const trafficLengthKm = summary.trafficLengthInMeters
            ? Math.round((summary.trafficLengthInMeters / 1000) * 10) / 10
            : 0;
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              liveTraffic: true,
              distanceKm: Math.round((summary.lengthInMeters / 1000) * 10) / 10,
              durationSec: summary.travelTimeInSeconds,
              durationTrafficSec: summary.travelTimeInSeconds,
              delaySec,
              noTrafficSec: Math.max(0, summary.travelTimeInSeconds - delaySec),
              trafficLengthKm,
              incidents: [],
            })
          );
        } catch (err) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: String(err), liveTraffic: false }));
        }
      });

      server.middlewares.use("/api/incidents", async (req, res, next) => {
        if (req.method !== "GET") return next();
        try {
          if (!key) {
            res.statusCode = 503;
            res.setHeader("Content-Type", "application/json");
            res.end(
              JSON.stringify({
                liveIncidents: false,
                incidents: [],
                error: "TOMTOM_API_KEY not configured",
              })
            );
            return;
          }
          const url = new URL(req.url || "", "http://localhost");
          const points = parsePathParam(url.searchParams.get("path") || "");
          if (points.length < 2) {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.end(
              JSON.stringify({
                error: "path required as lng,lat;lng,lat;...",
                liveIncidents: false,
                incidents: [],
              })
            );
            return;
          }
          const result = await fetchIncidentsAlongPath(key, points, { language: "cs-CZ" });
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(result));
        } catch (err) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              error: String(err),
              liveIncidents: false,
              incidents: [],
            })
          );
        }
      });
    },
  };
}

function copyOfflineMapsPlugin(enabled: boolean): Plugin {
  return {
    name: "copy-offline-maps",
    apply: "build",
    closeBundle() {
      if (!enabled) return;
      const from = path.resolve(__dirname, "offline-maps");
      const to = path.resolve(__dirname, "dist/offline");
      if (!fs.existsSync(from)) {
        console.warn("offline-maps/ missing — native APK will have no packed basemap");
        return;
      }
      fs.mkdirSync(to, { recursive: true });
      for (const name of ["corridor.pmtiles", "hike.pmtiles", "manifest.json"]) {
        const src = path.join(from, name);
        if (fs.existsSync(src)) fs.copyFileSync(src, path.join(to, name));
      }
      const otm = path.join(from, "otm");
      if (fs.existsSync(otm)) fs.cpSync(otm, path.join(to, "otm"), { recursive: true });
      console.log("copied offline-maps → dist/offline");
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const tomtomKey = env.TOMTOM_API_KEY || process.env.TOMTOM_API_KEY;
  const native = mode === "native";

  return {
    base: native ? "./" : "/s-b-sm-26/",
    envPrefix: "VITE_",
    define: native
      ? {
          "import.meta.env.VITE_NATIVE": JSON.stringify("1"),
          "import.meta.env.VITE_API_ORIGIN": JSON.stringify("https://vypravy.ironknot.cz"),
        }
      : {},
    plugins: [react(), tomtomTrafficPlugin(tomtomKey), copyOfflineMapsPlugin(native)],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      open: "/s-b-sm-26/",
      proxy: {
        "/api/forecast": {
          target: "https://api.met.no",
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api\/forecast/, "/weatherapi/locationforecast/2.0/compact"),
          headers: { "User-Agent": MET_USER_AGENT },
        },
      },
    },
  };
});
