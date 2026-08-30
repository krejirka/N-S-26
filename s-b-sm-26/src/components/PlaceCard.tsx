import { ExternalLink } from "lucide-react";
import NavigateButton from "./NavigateButton";
import type { EnrichedPlace, Place } from "@/types/trip";

export default function PlaceCard({
  place,
  coords,
}: {
  place: EnrichedPlace;
  coords?: Place | null;
}) {
  return (
    <article className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      {place.image && (
        <a href={place.image.sourceUrl} target="_blank" rel="noopener noreferrer" className="block">
          <img
            src={place.image.url}
            alt={place.image.alt}
            className="h-44 w-full object-cover transition hover:opacity-95"
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </a>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-semibold">{place.name}</h4>
          {coords && (
            <NavigateButton lat={coords.lat} lng={coords.lng} label={coords.name || place.name} variant="link">
              Navigovat
            </NavigateButton>
          )}
        </div>
        {place.tips && place.tips.length > 0 && (
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-muted-foreground">
            {place.tips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        )}
        {place.links && place.links.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {place.links.map((link) => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground hover:bg-muted"
              >
                {link.label}
                <ExternalLink className="h-3 w-3" />
              </a>
            ))}
          </div>
        )}
        {place.image && (
          <p className="mt-3 text-xs text-muted-foreground">
            Zdroj obrázku:{" "}
            <a href={place.image.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline">
              {place.image.source}
            </a>
          </p>
        )}
      </div>
    </article>
  );
}
