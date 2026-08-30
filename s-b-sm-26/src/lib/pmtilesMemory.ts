import { PMTiles, type RangeResponse, type Source } from "pmtiles";

class ArrayBufferSource implements Source {
  constructor(
    private readonly buffer: ArrayBuffer,
    private readonly key: string
  ) {}

  getKey(): string {
    return this.key;
  }

  async getBytes(offset: number, length: number): Promise<RangeResponse> {
    return { data: this.buffer.slice(offset, offset + length) };
  }
}

const cache = new Map<string, Promise<PMTiles | null>>();

export function loadPmtiles(url: string): Promise<PMTiles | null> {
  let pending = cache.get(url);
  if (!pending) {
    pending = fetch(url)
      .then(async (res) => {
        if (!res.ok) return null;
        const buf = await res.arrayBuffer();
        return new PMTiles(new ArrayBufferSource(buf, url));
      })
      .catch(() => null);
    cache.set(url, pending);
  }
  return pending;
}

export function offlineAssetUrl(file: string): string {
  const base = import.meta.env.BASE_URL.endsWith("/")
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;
  return `${base}offline/${file}`;
}
