/** Native Capacitor APK vs website. */

export const IS_NATIVE = import.meta.env.VITE_NATIVE === "1";

/** Vercel origin for live APIs when the WebView has no `/api` proxy. */
export const API_ORIGIN =
  import.meta.env.VITE_API_ORIGIN || (IS_NATIVE ? "https://vypravy.ironknot.cz" : "");

export function apiUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${API_ORIGIN}${p}`;
}

/**
 * App / APK version shown in the UI (web + Android) and embedded in the
 * downloadable APK filename.
 */
export const APP_VERSION = "1.1.7";
/** @deprecated use APP_VERSION — kept as alias for existing APK download UI */
export const APK_VERSION = APP_VERSION;

export const APK_FILE_NAME = `s-b-sm-26-${APP_VERSION}.apk`;
export const APK_DOWNLOAD_HREF = `${import.meta.env.BASE_URL}apk/${APK_FILE_NAME}`;
export const APK_ICON_SRC = `${import.meta.env.BASE_URL}android-apk.png`;
