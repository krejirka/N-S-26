import type { HikeElevationProfile, HikeProfileLabel } from "@/types/trip";

interface ElevationProfileProps {
  profile: HikeElevationProfile;
  compact?: boolean;
}

function xOf(km: number, kmMax: number, l: number, innerW: number) {
  if (kmMax <= 0) return l;
  return l + (km / kmMax) * innerW;
}

function yOf(ele: number, minEle: number, maxEle: number, t: number, innerH: number) {
  const span = Math.max(maxEle - minEle, 40);
  const pad = span * 0.08;
  return t + innerH - ((ele - minEle + pad) / (span + pad * 2)) * innerH;
}

function labelAnchor(label: HikeProfileLabel, all: HikeProfileLabel[]) {
  if (label.kind === "start") return "start";
  if (label.kind === "end") return "end";
  const i = all.findIndex((l) => l.id === label.id);
  return i <= all.length / 2 ? "start" : "end";
}

export default function ElevationProfile({ profile, compact = false }: ElevationProfileProps) {
  const samples = profile.samples;
  if (samples.length < 2) return null;

  const w = compact ? 340 : 420;
  const h = compact ? 118 : 148;
  const l = 36;
  const r = 10;
  const t = compact ? 22 : 28;
  const b = 20;
  const innerW = w - l - r;
  const innerH = h - t - b;
  const kmMax = samples[samples.length - 1].km;
  const minEle = profile.minEle;
  const maxEle = profile.maxEle;

  const coords = samples.map((s) => ({
    x: xOf(s.km, kmMax, l, innerW),
    y: yOf(s.ele, minEle, maxEle, t, innerH),
  }));
  const line = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");
  const area = `${line} L${coords[coords.length - 1].x.toFixed(1)},${(t + innerH).toFixed(1)} L${coords[0].x.toFixed(1)},${(t + innerH).toFixed(1)} Z`;

  return (
    <div className="min-w-0">
      <svg viewBox={`0 0 ${w} ${h}`} className="h-auto w-full" role="img" aria-label="Výškový profil">
        <rect x="0" y="0" width={w} height={h} fill="transparent" />
        <path d={area} fill="#b91c1c" fillOpacity="0.12" />
        <path d={line} fill="none" stroke="#b91c1c" strokeWidth="1.8" strokeLinejoin="round" />
        <text x={4} y={t + 4} fill="#64748b" fontSize="9">
          {maxEle} m
        </text>
        <text x={4} y={t + innerH} fill="#64748b" fontSize="9">
          {minEle} m
        </text>
        <text x={l} y={h - 4} fill="#64748b" fontSize="9">
          0 km
        </text>
        <text x={w - r} y={h - 4} textAnchor="end" fill="#64748b" fontSize="9">
          {kmMax.toLocaleString("cs-CZ", { maximumFractionDigits: 1 })} km
        </text>
        {profile.labels.map((lab) => {
          const x = xOf(lab.km, kmMax, l, innerW);
          const y = yOf(lab.ele, minEle, maxEle, t, innerH);
          const anchor = labelAnchor(lab, profile.labels);
          const dx = anchor === "start" ? 4 : -4;
          return (
            <g key={lab.id}>
              <line x1={x} y1={y} x2={x} y2={t + innerH} stroke="#94a3b8" strokeWidth="0.75" strokeDasharray="2 2" />
              <circle cx={x} cy={y} r="2.6" fill="#b91c1c" stroke="#fff" strokeWidth="1" />
              <text
                x={x + dx}
                y={Math.max(10, y - 6)}
                textAnchor={anchor}
                fill="#1e293b"
                fontSize={compact ? 8.5 : 9.5}
                fontWeight={lab.kind === "start" || lab.kind === "end" ? 700 : 600}
              >
                {lab.name}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="mt-0.5 text-[10px] text-muted-foreground">
        ↑ {profile.ascentM} m · ↓ {profile.descentM} m
        {compact ? "" : ` · ${profile.minEle}–${profile.maxEle} m n. m.`}
      </p>
    </div>
  );
}
