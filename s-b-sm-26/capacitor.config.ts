import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "cz.ironknot.vypravy.sbsm26",
  appName: "S-B-SM-26",
  webDir: "dist",
  android: {
    allowMixedContent: false,
  },
  server: {
    androidScheme: "https",
  },
};

export default config;
