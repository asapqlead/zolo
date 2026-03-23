"use client";
import { useEffect } from "react";
import { useZoloStore } from "@/lib/store";
import { useConfetti } from "@/lib/useConfetti";
import { useRouter } from "next/navigation";

interface Props {
  vibeScore: number;
  onClose: () => void;
}

export default function AllClearModal({ vibeScore, onClose }: Props) {
  const { fire } = useConfetti();
  const { profile } = useZoloStore();
  const router = useRouter();

  useEffect(() => {
    fire({ type: "burst" });
    const t = setTimeout(() => fire({ type: "mild" }), 600);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 300,
      background: "rgba(0,0,0,0.9)",
      backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "0 24px",
    }}>
      <div className="animate-bounce-in" style={{
        background: "var(--surface)",
        border: "1px solid var(--lime)50",
        borderRadius: 28,
        padding: "36px 28px",
        textAlign: "center",
        width: "100%",
        maxWidth: 380,
        boxShadow: "0 0 60px var(--lime)20",
      }}>
        <div style={{ fontSize: 60, marginBottom: 16, lineHeight: 1 }}>🎉</div>
        <h2 style={{
          fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 30,
          color: "var(--lime)", marginBottom: 8,
          textShadow: "0 0 30px var(--lime)60",
        }}>
          all clear!
        </h2>
        <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 20, lineHeight: 1.5 }}>
          you cleared everything before bedtime — that's the play
        </p>

        {/* Vibe preview */}
        <div style={{
          background: "var(--lime)10",
          border: "1px solid var(--lime)30",
          borderRadius: 16, padding: "14px 20px",
          marginBottom: 20,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
        }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 36, color: "var(--lime)" }}>
            {vibeScore}
          </div>
          <div style={{ textAlign: "left" }}>
            <div style={{ color: "var(--lime)", fontWeight: 700, fontSize: 14 }}>vibe score</div>
            <div style={{ color: "var(--text-muted)", fontSize: 12 }}>+100 XP bonus ⚡</div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            onClick={() => { router.push("/tasks"); onClose(); }}
            style={{
              background: "var(--lime)", color: "var(--bg)",
              border: "none", borderRadius: 14, padding: "14px",
              fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 15,
              cursor: "pointer", boxShadow: "0 0 20px var(--lime)60",
            }}>
            plan tomorrow's quests 🎯
          </button>
          <button onClick={onClose}
            style={{ background: "transparent", border: "1px solid var(--border)", borderRadius: 14, padding: "12px", color: "var(--text-muted)", cursor: "pointer", fontSize: 14 }}>
            maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
