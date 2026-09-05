import { registerPlugin } from "@capacitor/core";
import { PMTiles, type RangeResponse, type Source } from "pmtiles";

interface PmtilesAssetPlugin {
  open(options: { path: string }): Promise<{ id: string; size: number }>;
  read(options: { id: string; offset: number; length: number }): Promise<{ data: string }>;
  close(options: { id: string }): Promise<void>;
}

const PmtilesAsset = registerPlugin<PmtilesAssetPlugin>("PmtilesAsset");

function base64ToArrayBuffer(b64: string): ArrayBuffer {
  if (!b64) return new ArrayBuffer(0);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out.buffer;
}

/**
 * PMTiles Source that reads APK assets through the native PmtilesAsset plugin.
 * Avoids Capacitor WebView HTTP Range entirely.
 */
export class CapacitorPmtilesSource implements Source {
  private readonly opened: Promise<{ id: string; size: number }>;

  constructor(private readonly path: string) {
    this.opened = PmtilesAsset.open({ path });
  }

  getKey(): string {
    return `capacitor-asset:${this.path}`;
  }

  async getBytes(offset: number, length: number): Promise<RangeResponse> {
    const { id } = await this.opened;
    const { data } = await PmtilesAsset.read({ id, offset, length });
    return { data: base64ToArrayBuffer(data) };
  }
}

const pmtilesCache = new Map<string, PMTiles>();

/** Shared PMTiles instance per asset path (native only). */
export function nativePmtiles(path: string): PMTiles {
  let cached = pmtilesCache.get(path);
  if (!cached) {
    cached = new PMTiles(new CapacitorPmtilesSource(path));
    pmtilesCache.set(path, cached);
  }
  return cached;
}
