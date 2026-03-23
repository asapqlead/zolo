"use client";
import { getVibeLabel, getVibeColor } from "@/lib/store";

interface VibeScoreProps {
  score: number;
  size?: number;
}

export default function VibeScore({ score, size = 140 }: VibeScoreProps) {
  const color = getVibeColor(score);
  const label = getVibeLabel(score);
  const r = (size / 2) - 10;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  return (
    <div style={{ position: "relative", width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width={size} height={size} style={{ position: "absolute", top: 0, left: 0, transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="var(--surface2)" strokeWidth={8}
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth={8}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{
            filter: `drop-shadow(0 0 8px ${color})`,
            transition: "stroke-dasharray 1s cubic-bezier(0.34,1.56,0.64,1)",
          }}
        />
      </svg>
      <div style={{ textAlign: "center", zIndex: 1 }}>
        <div style={{
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: size * 0.26,
          color,
          lineHeight: 1,
          textShadow: `0 0 20px ${color}60`,
        }}>
          {score}
        </div>
        <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2, fontWeight: 500 }}>
          {label}
        </div>
      </div>
    </div>
  );
}
