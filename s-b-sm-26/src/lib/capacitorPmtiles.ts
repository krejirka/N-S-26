/**
 * Capacitor bridge to native PmtilesAsset plugin + PMTiles Source.
 *
 * IMPORTANT: must use the same `pmtiles` major as protomaps-leaflet (3.x),
 * otherwise leafletLayer silently mis-handles the archive instance.
 */
import { registerPlugin } from "@capacitor/core";
import { PMTiles, type RangeResponse, type Source } from "pmtiles";

interface PmtilesAssetPlugin {
  ping(): Promise<{ ok: boolean; plugin: string }>;
  open(options: { path: string }): Promise<{ id: string; size: number; magic: string }>;
  read(options: { id: string; offset: number; length: number }): Promise<{ data: string }>;
  close(options: { id: string }): Promise<void>;
}

const PmtilesAsset = registerPlugin<PmtilesAssetPlugin>("PmtilesAsset");

const CHUNK = 256 * 1024; // stay well under Android Binder ~1 MiB limit (base64 expands)

function base64ToUint8(b64: string): Uint8Array {
  if (!b64) return new Uint8Array(0);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export class CapacitorPmtilesSource implements Source {
  private readonly opened: Promise<{ id: string; size: number }>;

  constructor(readonly path: string) {
    this.opened = (async () => {
      const ping = await PmtilesAsset.ping();
      if (!ping?.ok) throw new Error("PmtilesAsset plugin not available");
      const opened = await PmtilesAsset.open({ path });
      if (opened.magic !== "PMTiles") {
        throw new Error(`Bad magic for ${path}: ${opened.magic}`);
      }
      console.info("[PmtilesAsset] open", path, "size", opened.size);
      return opened;
    })();
  }

  getKey(): string {
    return `raf:${this.path}`;
  }

  async getBytes(offset: number, length: number): Promise<RangeResponse> {
    const { id } = await this.opened;
    if (length <= 0) return { data: new ArrayBuffer(0) };
    if (length <= CHUNK) {
      const { data } = await PmtilesAsset.read({ id, offset, length });
      const bytes = base64ToUint8(data);
      // Copy into a tight ArrayBuffer — pmtiles expects exact length.
      return { data: bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) };
    }
    // Chunked read for large leaf directories / metadata (Binder ~1 MiB limit).
    const out = new Uint8Array(length);
    let written = 0;
    while (written < length) {
      const n = Math.min(CHUNK, length - written);
      const { data } = await PmtilesAsset.read({ id, offset: offset + written, length: n });
      const part = base64ToUint8(data);
      if (part.length === 0) break;
      out.set(part, written);
      written += part.length;
      if (part.length < n) break;
    }
    return { data: out.buffer.slice(0, written) };
  }
}

const cache = new Map<string, PMTiles>();

/** PMTiles archive for an asset under public/ (e.g. offline/basemap.pmtiles). */
export function nativePmtiles(path: string): PMTiles {
  let p = cache.get(path);
  if (!p) {
    p = new PMTiles(new CapacitorPmtilesSource(path));
    cache.set(path, p);
  }
  return p;
}

export async function probeNativePmtiles(path: string): Promise<{ ok: boolean; detail: string }> {
  try {
    const ping = await PmtilesAsset.ping();
    if (!ping?.ok) return { ok: false, detail: "plugin missing" };
    const tiles = nativePmtiles(path);
    const h = await tiles.getHeader();
    return {
      ok: true,
      detail: `z${h.minZoom}-${h.maxZoom} type=${h.tileType}`,
    };
  } catch (e) {
    return { ok: false, detail: e instanceof Error ? e.message : String(e) };
  }
}
