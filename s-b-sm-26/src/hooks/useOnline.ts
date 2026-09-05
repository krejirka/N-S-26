import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { Network } from "@capacitor/network";

/**
 * Connectivity for UI badges / live APIs.
 * On Android WebView, navigator.onLine often stays true with mobile data off —
 * Capacitor Network uses the real ConnectivityManager.
 */
export function useOnline(): boolean {
  const [online, setOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine
  );

  useEffect(() => {
    let removed = false;
    let handle: { remove: () => void } | undefined;

    const apply = (value: boolean) => {
      if (!removed) setOnline(value);
    };

    if (Capacitor.isNativePlatform()) {
      Network.getStatus()
        .then((s) => apply(s.connected))
        .catch(() => apply(navigator.onLine));

      Network.addListener("networkStatusChange", (s) => apply(s.connected))
        .then((h) => {
          handle = h;
        })
        .catch(() => {
          /* fall through to window events */
        });
    }

    const on = () => {
      if (Capacitor.isNativePlatform()) {
        Network.getStatus()
          .then((s) => apply(s.connected))
          .catch(() => apply(true));
      } else {
        apply(true);
      }
    };
    const off = () => apply(false);

    window.addEventListener("online", on);
    window.addEventListener("offline", off);

    return () => {
      removed = true;
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
      handle?.remove();
    };
  }, []);

  return online;
}
