/** Build stable Wikimedia Commons image URLs (Special:FilePath redirects to upload server). */
export function commonsImage(filename, alt) {
  const encoded = encodeURIComponent(filename);
  return {
    url: `https://commons.wikimedia.org/wiki/Special:FilePath/${encoded}?width=640`,
    alt,
    source: "Wikimedia Commons",
    sourceUrl: `https://commons.wikimedia.org/wiki/File:${encoded}`,
    _filename: filename,
  };
}

export async function resolveCommonsImage(image) {
  if (!image?._filename) return image;
  const res = await fetch(image.url, {
    method: "HEAD",
    redirect: "follow",
    headers: { "User-Agent": "n-s-26/1.0" },
  });
  if (!res.ok) return { ...image, url: image.url };
  const { _filename: _f, ...rest } = image;
  void _f;
  return { ...rest, url: res.url };
}

export async function resolvePlacesImages(places) {
  return Promise.all(
    places.map(async (place) => {
      if (!place.image) return place;
      return { ...place, image: await resolveCommonsImage(place.image) };
    })
  );
}

/** Verified Commons filenames used in itinerary enrichment. */
export const COMMONS_FILES = {
  hradec: "Bila vez Hradec Kralove.jpg",
  oslo: "Oslo Harbour.jpg",
  lillehammer: "Lillehammer.jpg",
  rondane: "Rondane.jpg",
  snohetta: "Viewpoint Snøhetta.jpg",
  innerdalen: "Innerdalen.jpg",
  trondheim: "Trondheim.jpg",
  laksforsen: "Laksforsen.jpg",
  svartisen: "Svartisen.jpg",
  junkerdal: "Junkerdal.jpg",
  skuleskogen: "Slåttdalsskrevan.jpg",
  ales: "Ales stenar.jpg",
  arvidsjaur: "Arvidsjaurs kyrka.jpg",
  vimmerby: "Astrid Lindgrens Värld - Villa Villekulla.jpg",
};
