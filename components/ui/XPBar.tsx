"use client";
import { calculateLevel } from "@/lib/store";

interface XPBarProps {
  totalXP: number;
  compact?: boolean;
}

export default function XPBar({ totalXP, compact = false }: XPBarProps) {
  const { level, xpInLevel, xpForNext } = calculateLevel(totalXP);
  const pct = Math.min((xpInLevel / xpForNext) * 100, 100);

  if (compact) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, color: "var(--lime)", fontSize: 13 }}>
          LVL {level}
        </span>
        <div style={{ flex: 1, height: 4, background: "var(--surface2)", borderRadius: 2, overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              width: `${pct}%`,
              background: "linear-gradient(90deg, var(--lime), var(--cyan))",
              borderRadius: 2,
              transition: "width 0.6s cubic-bezier(0.34,1.56,0.64,1)",
            }}
          />
        </div>
        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{xpInLevel}/{xpForNext}</span>
      </div>
    );
  }

  return (
    <div style={{
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 16,
      padding: "16px 20px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
        <div>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 28, color: "var(--lime)" }}>
            LVL {level}
          </span>
          <span style={{ color: "var(--text-muted)", fontSize: 13, marginLeft: 8 }}>
            {totalXP.toLocaleString()} XP total
          </span>
        </div>
        <div style={{ textAlign: "right", color: "var(--text-muted)", fontSize: 12 }}>
          <div>{xpInLevel} / {xpForNext} XP</div>
          <div>to next level</div>
        </div>
      </div>
      <div style={{ height: 8, background: "var(--surface2)", borderRadius: 4, overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: "linear-gradient(90deg, var(--lime), var(--cyan))",
            borderRadius: 4,
            transition: "width 0.8s cubic-bezier(0.34,1.56,0.64,1)",
            boxShadow: "0 0 12px var(--lime)",
          }}
        />
      </div>
    </div>
  );
}
