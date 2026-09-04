/** Native Capacitor APK vs website. */

export const IS_NATIVE = import.meta.env.VITE_NATIVE === "1";

/** Vercel origin for live APIs when the WebView has no `/api` proxy. */
export const API_ORIGIN =
  import.meta.env.VITE_API_ORIGIN || (IS_NATIVE ? "https://vypravy.ironknot.cz" : "");

export function apiUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${API_ORIGIN}${p}`;
}

/** Sideload APK with packed maps. Same-origin URL; Vercel redirects to GitHub Releases if the file is too large for the CDN. */
export const APK_VERSION = "1.1.0";
export const APK_DOWNLOAD_HREF = `${import.meta.env.BASE_URL}apk/s-b-sm-26.apk`;
export const APK_ICON_SRC = `${import.meta.env.BASE_URL}android-apk.png`;
