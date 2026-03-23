"use client";
import { getVibeLabel, getVibeColor } from "@/lib/store";

interface VibeScoreProps { score: number; size?: number; }

export default function VibeScore({ score, size = 140 }: VibeScoreProps) {
  const color = getVibeColor(score);
  const label = getVibeLabel(score);
  const r = (size / 2) - 10;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  return (
    <div style={{ position: "relative", width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width={size} height={size} style={{ position: "absolute", top: 0, left: 0, transform: "rotate(-90deg)" }}>
        {/* track */}
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={6} />
        {/* progress */}
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={6}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${color})`, transition: "stroke-dasharray 500ms ease" }} />
      </svg>
      <div style={{ textAlign: "center", zIndex: 1 }}>
        {/* spec §5.1 vibe score: Syne 800 40px */}
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: size * 0.28, color, lineHeight: 1, textShadow: `0 0 16px ${color}50` }}>
          {score}
        </div>
        {/* spec §3 microcopy: DM Sans 400 9-10px lowercase */}
        <div style={{ fontSize: 9, color: `${color}b0`, marginTop: 3, fontFamily: "var(--font-body)", fontWeight: 400 }}>
          {label}
        </div>
      </div>
    </div>
  );
}
