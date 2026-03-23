"use client";
import { useEffect, useState } from "react";
import { useConfetti } from "@/lib/useConfetti";

const MILESTONES = [7, 14, 30, 60, 100, 365];

export function useStreakMilestone(streak: number) {
  const [milestone, setMilestone] = useState<number | null>(null);
  const { fire } = useConfetti();

  useEffect(() => {
    if (MILESTONES.includes(streak)) {
      setMilestone(streak);
      fire({ type: "streak" });
    }
  }, [streak]);

  return { milestone, dismiss: () => setMilestone(null) };
}

export default function StreakMilestoneBanner({ streak, onDismiss }: { streak: number; onDismiss: () => void }) {
  const labels: Record<number, string> = {
    7: "one week! 🔥",
    14: "two weeks! 🚀",
    30: "one month! 💎",
    60: "two months! 🏆",
    100: "100 days! 👑",
    365: "one year! 🌟",
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 400,
      background: "rgba(0,0,0,0.88)",
      backdropFilter: "blur(10px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "0 24px",
    }}>
      <div className="animate-bounce-in" style={{
        background: "var(--surface)",
        border: "2px solid var(--amber)",
        borderRadius: 28, padding: "40px 28px",
        textAlign: "center", width: "100%", maxWidth: 340,
        boxShadow: "0 0 60px var(--amber)30",
      }}>
        <div style={{ fontSize: 64, marginBottom: 12, lineHeight: 1 }}>🔥</div>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 44, color: "var(--amber)", lineHeight: 1, marginBottom: 6, textShadow: "0 0 30px var(--amber)60" }}>
          {streak}
        </div>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 20, color: "var(--text)", marginBottom: 8 }}>
          day streak — {labels[streak] ?? "milestone!"}
        </div>
        <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 28, lineHeight: 1.5 }}>
          consistency is the whole game. you're building something real.
        </p>
        <button onClick={onDismiss}
          style={{ background: "var(--amber)", color: "var(--bg)", border: "none", borderRadius: 14, padding: "14px 32px", fontFamily: "var(--font-body)", fontWeight: 800, fontSize: 15, cursor: "pointer", boxShadow: "0 0 20px var(--amber)60" }}>
          let's keep going ⚡
        </button>
      </div>
    </div>
  );
}
