"use client";
import { calculateLevel } from "@/lib/store";

interface XPBarProps { totalXP: number; compact?: boolean; }

export default function XPBar({ totalXP, compact = false }: XPBarProps) {
  const { level, xpInLevel, xpForNext } = calculateLevel(totalXP);
  const pct = Math.min((xpInLevel / xpForNext) * 100, 100);

  if (compact) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {/* spec §3: stats & numbers Syne 700 */}
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--lime)", fontSize: 13 }}>
          lvl {level}
        </span>
        <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
          <div style={{
            height: "100%", width: `${pct}%`,
            background: "linear-gradient(90deg, var(--cyan), var(--lime))",
            borderRadius: 2, transition: "width 500ms ease",
          }} />
        </div>
        <span style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>{xpInLevel}/{xpForNext}</span>
      </div>
    );
  }

  return (
    <div style={{
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: "var(--card-radius)",
      padding: "var(--card-pad)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
        <div>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 36, color: "var(--lime)" }}>
            lvl {level}
          </span>
          <span style={{ color: "var(--text-muted)", fontSize: 12, marginLeft: 8 }}>
            {totalXP.toLocaleString()} xp total
          </span>
        </div>
        <div style={{ textAlign: "right", color: "var(--text-muted)", fontSize: 11 }}>
          <div>{xpInLevel} / {xpForNext} xp</div>
          <div>to next level</div>
        </div>
      </div>
      <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${pct}%`,
          background: "linear-gradient(90deg, var(--cyan), var(--lime))",
          borderRadius: 2, transition: "width 500ms ease",
          boxShadow: "0 0 8px var(--lime)60",
        }} />
      </div>
    </div>
  );
}
