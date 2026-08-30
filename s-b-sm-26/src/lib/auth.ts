export type AccessMode = "full" | "limited";

const SALT = "ns26|v1|";
const STORAGE_KEY = "ns26.access";

/** Salted SHA-256 digests — plaintext passwords are never stored in the bundle. */
const MODE_HASHES: Record<string, AccessMode> = {
  "6caa8fd37994bbc499ae9d293c9ec5b7458044d1e884176b46a307e4e96ff706": "full",
  a62a9457d962ca627bc951e2955f8f41f01c3285e543e9e4c8b06f7dd8e11cbf: "limited",
};

async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function verifyPassword(password: string): Promise<AccessMode | null> {
  const hash = await sha256Hex(SALT + password.trim());
  return MODE_HASHES[hash] ?? null;
}

export function persistAccess(hash: string) {
  try {
    localStorage.setItem(STORAGE_KEY, hash);
  } catch {
    // storage unavailable (private mode) — session-only access
  }
}

export async function persistPassword(password: string) {
  persistAccess(await sha256Hex(SALT + password.trim()));
}

/** Restore mode from a previously stored digest; invalid values yield null. */
export function restoreAccess(): AccessMode | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    return MODE_HASHES[stored] ?? null;
  } catch {
    return null;
  }
}

export function clearAccess() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
