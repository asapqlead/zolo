"use client";
import { useState } from "react";
import { useZoloStore } from "@/lib/store";
import { format, addDays } from "date-fns";
import { X, Moon } from "lucide-react";

interface Props { onClose: () => void; }
type Decision = "move" | "keep" | "dismiss";

export default function BedtimeHandoff({ onClose }: Props) {
  const { getTodayTasks, rescheduleTask, archiveTask, addXP } = useZoloStore();
  const incompleteTasks = getTodayTasks().filter(t => !t.completed);
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const [done, setDone] = useState(false);

  function decide(id: string, dec: Decision) {
    setDecisions(prev => ({ ...prev, [id]: dec }));
  }

  function finish() {
    const tomorrow = format(addDays(new Date(), 1), "yyyy-MM-dd");
    let movedCount = 0;
    incompleteTasks.forEach(t => {
      const dec = decisions[t.id] || "keep";
      if (dec === "move") { rescheduleTask(t.id, tomorrow); movedCount++; }
      else if (dec === "dismiss") { archiveTask(t.id); }
    });
    if (movedCount > 0) addXP(20);
    setDone(true);
    setTimeout(onClose, 2000);
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(0,0,0,0.80)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "flex-end",
    }}>
      {/* spec §6: bottom sheet bg #13131A, 2px rgba(fff,0.08) top border, 20px radius */}
      <div className="animate-sheet" style={{
        width: "100%", maxWidth: 480, margin: "0 auto",
        background: "#13131A",
        borderTop: "2px solid rgba(255,255,255,0.08)",
        borderRadius: "20px 20px 0 0",
        padding: 16, maxHeight: "85dvh", overflowY: "auto",
      }}>
        {done ? (
          <div style={{ textAlign: "center", padding: "36px 0" }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>🌙</div>
            {/* spec §6: title Syne 800 */}
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20, marginBottom: 6 }}>goodnight ✨</div>
            <div style={{ color: "var(--text-muted)", fontSize: 13 }}>streak's safe — see you tomorrow</div>
            {Object.values(decisions).filter(d => d === "move").length > 0 && (
              <div style={{ color: "var(--lime)", fontSize: 12, marginTop: 8 }}>+20 xp for planning ahead 🎯</div>
            )}
          </div>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <Moon size={16} color="var(--purple)" />
                  {/* spec §6: "winding down?" Syne 800 */}
                  <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20 }}>winding down?</span>
                </div>
                <p style={{ color: "var(--text-muted)", fontSize: 12, lineHeight: 1.5 }}>
                  you've got {incompleteTasks.length} task{incompleteTasks.length !== 1 ? "s" : ""} left
                </p>
              </div>
              <button onClick={onClose} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            {incompleteTasks.length === 0 ? (
              <div style={{ textAlign: "center", padding: "28px 0" }}>
                <p style={{ color: "var(--lime)", fontWeight: 500, fontSize: 14 }}>all quests done — you crushed it 🎉</p>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap-cards)", marginBottom: 14 }}>
                  {incompleteTasks.map(task => {
                    const dec = decisions[task.id];
                    return (
                      /* spec §6: nested card #1A1A24 */
                      <div key={task.id} style={{
                        background: "#1A1A24",
                        border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: 12, padding: 11,
                      }}>
                        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10, color: "var(--text)" }}>{task.title}</div>
                        {/* spec §6: 3 buttons per task */}
                        <div style={{ display: "flex", gap: 6 }}>
                          {/* spec §6: "to tomorrow" secondary */}
                          <button onClick={() => decide(task.id, "move")}
                            style={{ flex: 1, background: "transparent", border: `1px solid ${dec === "move" ? "rgba(255,255,255,0.30)" : "rgba(255,255,255,0.12)"}`, borderRadius: 8, padding: "8px 4px", color: dec === "move" ? "var(--text)" : "var(--text-muted)", cursor: "pointer", fontSize: 11, lineHeight: 1, letterSpacing: "0.2px", transition: "all 0.18s" }}>
                            to tomorrow
                          </button>
                          {/* spec §6: "keep tonight" Lime outline */}
                          <button onClick={() => decide(task.id, "keep")}
                            style={{ flex: 1, background: "transparent", border: `1px solid ${dec === "keep" ? "var(--lime)" : "rgba(200,255,0,0.25)"}`, borderRadius: 8, padding: "8px 4px", color: dec === "keep" ? "var(--lime)" : "rgba(200,255,0,0.6)", cursor: "pointer", fontSize: 11, lineHeight: 1, letterSpacing: "0.2px", transition: "all 0.18s" }}>
                            keep tonight
                          </button>
                          {/* spec §6: "x" ghost dismiss */}
                          <button onClick={() => decide(task.id, "dismiss")}
                            style={{ width: 36, background: "transparent", border: `1px solid ${dec === "dismiss" ? "rgba(255,255,255,0.20)" : "rgba(255,255,255,0.06)"}`, borderRadius: 8, padding: "8px 4px", color: "var(--text-muted)", cursor: "pointer", fontSize: 11, lineHeight: 1, flexShrink: 0, transition: "all 0.18s" }}>
                            ✕
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* spec §6: "done for tonight" Purple primary CTA */}
                <button onClick={finish}
                  style={{ width: "100%", background: "var(--purple)", color: "white", border: "none", borderRadius: 14, padding: "13px 16px", fontSize: 13, fontWeight: 500, cursor: "pointer", lineHeight: 1, letterSpacing: "0.2px", boxShadow: "0 0 16px rgba(123,63,228,0.40)" }}>
                  done for tonight 🌙
                </button>
                {/* spec §6: footer note Muted 10px */}
                <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 10, marginTop: 10, lineHeight: 1.4 }}>
                  moving tasks: +20 xp for planning ahead
                </p>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
